// The standard Prism app page: loads app.holo with the vendored prism-code
// runtime, verifies it, shows what was proved and what is trusted, lets a
// visitor send requests, and replays the examples the archive carries.
// Everything specific to this app comes from app.json and the holo. The
// service worker precaches it all, so the page works offline after one visit.
import { load } from "./vendor/prism-code/src/browser.mjs";

const $ = (id) => document.getElementById(id);
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });
const describe = (error) => error?.code ?? error?.message ?? String(error);

const hex = (bytes) =>
  "hex:" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// Text when the bytes are valid UTF-8 with no control characters but tab and
// newline; hex otherwise, so a binary request is still readable and reusable.
function show(bytes) {
  try {
    const text = decoder.decode(bytes);
    // eslint-disable-next-line no-control-regex
    return /[\u0000-\u0008\u000b-\u001f\u007f]/.test(text) ? hex(bytes) : text;
  } catch {
    return hex(bytes);
  }
}

function parse(text) {
  if (!text.startsWith("hex:")) return encoder.encode(text);
  const digits = text.slice(4).replace(/\s+/g, "");
  if (digits.length % 2 || /[^0-9a-f]/i.test(digits)) throw new Error("malformed hex");
  return Uint8Array.from(digits.match(/../g) ?? [], (pair) => parseInt(pair, 16));
}

function chip(element, text, state) {
  element.textContent = text;
  element.className = `chip chip-${state}`;
}

function item(list, mark, markClass, name, what) {
  const li = document.createElement("li");
  const m = document.createElement("span");
  m.className = markClass;
  m.textContent = mark;
  const body = document.createElement("div");
  const n = document.createElement("div");
  n.className = "name";
  n.textContent = name;
  const w = document.createElement("div");
  w.className = "what";
  w.textContent = what;
  body.append(n, w);
  li.append(m, body);
  list.append(li);
}

function theme() {
  const root = document.documentElement;
  const button = $("theme");
  const paint = () => (button.textContent = root.classList.contains("dark") ? "Light" : "Dark");
  paint();
  button.addEventListener("click", () => {
    root.classList.toggle("dark");
    try {
      localStorage.setItem("prism-theme", root.classList.contains("dark") ? "dark" : "light");
    } catch {
      // A private window keeps no preference; the page still switches.
    }
    paint();
  });
}

// Install the service worker; when a new one is waiting, show one chip and
// reload only when the visitor asks. Never silently.
function offline() {
  const paint = () => ($("offline").hidden = navigator.onLine);
  paint();
  addEventListener("online", paint);
  addEventListener("offline", paint);
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").then((registration) => {
    const offer = (worker) => {
      if (!navigator.serviceWorker.controller) return;
      $("update").hidden = false;
      $("reload").addEventListener("click", () => worker.postMessage("skip-waiting"), { once: true });
    };
    if (registration.waiting) offer(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") offer(worker);
      });
    });
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
  }).catch(() => {
    // No worker: the page still works online.
  });
}

function describeApp(meta) {
  document.title = meta.name;
  $("name-text").textContent = meta.name;
  $("purpose").textContent = meta.purpose;
  $("claim").textContent = meta.claim;
  $("prop-name").textContent = meta.proposition.name;
  $("prop-text").textContent = meta.proposition.text;
  $("prop-plain").textContent = meta.proposition.plain;
  for (const t of meta.theorems) {
    item($("theorems"), "proved", "tick", `${t.name} : ${t.statement}`, `${t.how}. ${t.where}`);
  }
  for (const p of meta.pinned) {
    item($("pinned"), "pinned", "pin", p.name, `${p.what} ${p.where}`);
  }
  for (const t of meta.trusted) {
    item($("trusted"), "trusted", "pin", t.name, t.value);
  }
  $("att-proof").textContent = meta.attestations.proof.id;
  $("att-proof").href = meta.attestations.proof.url;
  $("att-build").textContent = meta.attestations.build.id;
  $("att-build").href = meta.attestations.build.url;
  $("request-label").textContent = meta.inputLabel;
  $("request").placeholder = meta.placeholder ?? "";
  $("submit").textContent = meta.submitLabel;
  $("output-label").textContent = meta.outputLabel;
  $("repo").href = meta.repository;
  $("report").href = meta.report;
}

// The answer's state: the app's refusal is a correct answer shown as a
// warning, never as a failure; a runtime error is a failure.
function answerState(text, meta) {
  if (text === meta.invalidResponse) return "warn";
  return "good";
}

async function main() {
  theme();
  offline();
  let meta;
  try {
    meta = await (await fetch("./app.json")).json();
    describeApp(meta);
  } catch (error) {
    $("name-text").textContent = "Prism app";
    chip($("verified"), `app.json failed to load: ${describe(error)}`, "bad");
    return;
  }

  let app;
  try {
    app = await load("./app.holo");
  } catch (error) {
    chip($("verified"), `failed to load: ${describe(error)}`, "bad");
    chip($("replayed"), "no app", "bad");
    return;
  }

  const { identities } = app;
  chip($("verified"), identities.verified ? "verified" : "NOT verified", identities.verified ? "good" : "bad");
  $("fingerprint").textContent = identities.archiveFingerprint;
  $("limits").textContent = app.limits
    ? `request ${app.limits.request} bytes, response ${app.limits.response} bytes, guest ${app.limits.guestAllocation} bytes`
    : "unknown";

  $("copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(identities.archiveFingerprint);
      $("copy").textContent = "Copied";
      setTimeout(() => ($("copy").textContent = "Copy"), 1500);
    } catch {
      $("copy").textContent = "Select it";
    }
  });

  for (const vector of app.vectors) {
    const row = document.createElement("tr");
    const request = document.createElement("td");
    const use = document.createElement("button");
    use.type = "button";
    use.className = "use";
    const text = show(vector.request);
    if (text.length > 48) {
      use.textContent = `${text.slice(0, 24)} … ${text.slice(-8)}`;
      const note = document.createElement("div");
      note.className = "long";
      note.textContent = `${vector.request.length} bytes`;
      use.setAttribute("aria-label", `Use the ${vector.request.length} byte example`);
      request.append(use, note);
    } else {
      use.textContent = text === "" ? "(empty)" : text;
      request.append(use);
    }
    use.addEventListener("click", () => {
      $("request").value = text;
      $("request").focus();
    });
    const answer = document.createElement("td");
    const code = document.createElement("code");
    code.textContent = show(vector.response);
    answer.append(code);
    row.append(request, answer);
    $("examples").append(row);
  }

  $("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const raw = $("request").value;
    $("echo").textContent = raw === "" ? "(empty)" : raw;
    try {
      const response = show(await app.dispatch(parse(raw)));
      chip($("response"), response, answerState(response, meta));
    } catch (error) {
      chip($("response"), `dispatch failed: ${describe(error)}`, "bad");
    }
  });

  async function replay() {
    const button = $("replay");
    button.disabled = true;
    chip($("replayed"), "replaying", "wait");
    try {
      const result = await app.acceptance();
      chip($("replayed"), `${result.passed} of ${result.total} passed`, result.passed === result.total ? "good" : "bad");
    } catch (error) {
      chip($("replayed"), `failed: ${describe(error)}`, "bad");
    } finally {
      button.disabled = false;
    }
  }
  $("replay").addEventListener("click", replay);
  await replay();
}

main();
