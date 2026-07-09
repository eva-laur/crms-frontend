import dotenv from "dotenv";
dotenv.config();
const app = (await import("./core/App.js")).default;
const server = app.listen(4321, () => console.log("listening"));
setTimeout(() => { server.close(); process.exit(0); }, 60000);
