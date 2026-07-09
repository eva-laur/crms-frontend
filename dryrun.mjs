import dotenv from "dotenv";
dotenv.config({ path: new URL("./.env", import.meta.url).pathname });
process.chdir(new URL(".", import.meta.url).pathname);
const app = (await import("./core/App.js")).default;
console.log("App loaded OK. Registered routers:", app._router ? "yes" : "no");

// List mounted top-level paths
const stack = app._router.stack.filter(l => l.name === "router");
for (const l of stack) {
  const path = l.regexp.source.replace("^\\\\", "").replace("\\\\/?(?=\\\\/|$)", "");
  console.log("mounted:", path);
}
