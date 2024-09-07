import fs from "fs";

export default function createDate() {
  const currentDate = new Date().toLocaleString("en-gb", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  try {
    fs.writeFileSync("src/data/updateDate.js", `export const updateDate ="${currentDate + ", " + currentTime}"`);
    setTimeout(() => {
      console.info(`🏁 Job completed: ${currentDate} ${currentTime}`);
    }, 5000);
  } catch (err) {
    console.error("❌There was an error writing updateDate");
    console.error(err);
  }
}
