import fs from "fs";
import natsort from "./src/functionsBuilding/natsort.js";
import createDate from "./src/functionsBuilding/createDate.js";
import normalizeDiacriticString from "./src/functionsBuilding/normalizeDiacriticString.js";
import sortCitationsList from "./src/functionsBuilding/sortCitationsList.js";
import findNonUniqueHeadwords from "./src/functionsBuilding/findNonUniqueHeadwords.js";
import logTsvCreationDate from "./src/functionsBuilding/logTsvCreationDate.js";
import createLocatorSortedTableHtml from "./src/functionsBuilding/createLocatorSortedTableHtml.js";
import { openingHtmlheadwordLocatorCountHtml } from "./src/functions/htmlParts/openingHtmlheadwordLocatorCountHtml.js";

let alphabetKeys;
let locatorFirstArray = [];
let xrefArray = [];
let rawIndexArray = [];
const indexObject = {
  A: {},
  B: {},
  C: {},
  D: {},
  E: {},
  F: {},
  G: {},
  H: {},
  I: {},
  J: {},
  K: {},
  L: {},
  M: {},
  N: {},
  O: {},
  P: {},
  Q: {},
  R: {},
  S: {},
  T: {},
  U: {},
  V: {},
  W: {},
  Y: {},
  Z: {},
};
let alphabetGroupedObject = {
  A: {},
  B: {},
  C: {},
  D: {},
  E: {},
  F: {},
  G: {},
  H: {},
  I: {},
  J: {},
  K: {},
  L: {},
  M: {},
  N: {},
  O: {},
  P: {},
  Q: {},
  R: {},
  S: {},
  T: {},
  U: {},
  V: {},
  W: {},
  Y: {},
  Z: {},
};

// build the index object
function createIndexObject() {
  let csvData;

  // read csv file
  try {
    const tsvFileContents = fs.readFileSync("src/data/general-index.csv", "utf8");
    csvData = tsvFileContents;
    console.info("✅ successfully read TSV file");
  } catch (err) {
    console.errror("❌There was an error reading general-index.csv");
    console.error(err);
  }

  let lines = csvData.split("\n");

  for (let i = 0; i < lines.length; i++) {
    rawIndexArray[i] = lines[i].split("\t");
  }

  // change blank sub-headings to ~
  function transformArray(rawIndexArray) {
    return rawIndexArray.map(item => {
      const subheadHasJustWhitespace = /^\s*$/.test(item[1]);
      if (subheadHasJustWhitespace && !item[2].includes("xref")) {
        item[1] = "~";
      }
      return item;
    });
  }

  rawIndexArray = transformArray(rawIndexArray);

  for (let i = 0; i < rawIndexArray.length - 1; i++) {
    const head = rawIndexArray[i][0].trim();
    const sub = rawIndexArray[i][1].trim();
    const locator = rawIndexArray[i][2].trim();

    const headStartingWithLetter = head.replace("“", "");
    const firstRealLetter = normalizeDiacriticString(headStartingWithLetter.charAt(0)).toUpperCase();
    if (head === "") {
      console.error(`❌  @${i + 1} there is a blank headword! Sub: ${sub}, Locator: ${locator}`);
    }
    if (/xref/.test(head)) {
      console.warn(`❌ The headword  @${i + 1} "${head}" contains 'xref'`);
    }
    if (/["']/.test(sub + head)) {
      console.warn(`❌ The sub/headword @${i + 1} ${head}/${sub} contains straight quotes
      This may indicate that the csv file format was incorrect`);
    }
    if (!alphabetGroupedObject[firstRealLetter].hasOwnProperty(head)) {
      // the key of the headword does not exist in the object yet, so create the key and add the locator-xref object
      alphabetGroupedObject[firstRealLetter][head] = { [sub]: { locators: [], xrefs: [] } };
      if (/xref/.test(locator)) {
        alphabetGroupedObject[firstRealLetter][head][sub].xrefs.push(locator);
      } else {
        alphabetGroupedObject[firstRealLetter][head][sub].locators.push(locator);
      }
    } else {
      if (!alphabetGroupedObject[firstRealLetter][head].hasOwnProperty(sub)) {
        // the key for the headword exists, but the sub does not exist as a key
        alphabetGroupedObject[firstRealLetter][head][sub] = { locators: [], xrefs: [] };

        if (/xref/.test(locator)) {
          alphabetGroupedObject[firstRealLetter][head][sub].xrefs.push(locator);
        } else {
          alphabetGroupedObject[firstRealLetter][head][sub].locators.push(locator);
        }
      } else {
        // the head and sub already exist, so the locator must be pushed into the array
        if (/xref/.test(locator)) {
          alphabetGroupedObject[firstRealLetter][head][sub].xrefs.push(locator);
        } else {
          alphabetGroupedObject[firstRealLetter][head][sub].locators.push(locator);
        }
      }
    }
  }

  // sort locators
  const alphabetArray = Object.keys(alphabetGroupedObject);
  for (let a = 0; a < alphabetArray.length; a++) {
    const headwords = Object.keys(alphabetGroupedObject[alphabetArray[a]]);
    const alphabetObject = alphabetGroupedObject[alphabetArray[a]];

    for (let i = 0; i < headwords.length; i++) {
      const subs = Object.keys(alphabetObject[headwords[i]]);
      const headWordObject = alphabetObject[headwords[i]];
      for (let x = 0; x < subs.length; x++) {
        headWordObject[subs[x]].locators = sortCitationsList(headWordObject[subs[x]].locators);
      }

      for (let x = 0; x < subs.length; x++) {
        headWordObject[subs[x]].xrefs.sort();
      }
    }
  }

  function sortedKeys(object) {
    return Object.keys(object).sort((a, b) => {
      a = a.replace("“", "");
      b = b.replace("“", "");
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }

  alphabetKeys = Object.keys(indexObject);

  for (let i = 0; i < alphabetKeys.length; i++) {
    const unsortHeadwObj = alphabetGroupedObject[alphabetKeys[i]];
    const sortedHeadwObjArr = sortedKeys(unsortHeadwObj);
    for (let x = 0; x < sortedHeadwObjArr.length; x++) {
      indexObject[alphabetKeys[i]][sortedHeadwObjArr[x]] = alphabetGroupedObject[alphabetKeys[i]][sortedHeadwObjArr[x]];
    }
  }

  function getRootHeadword(headword) {
    return headword.replace(/ \(.+?\)/, "");
  }

  for (let i = 0; i < alphabetKeys.length; i++) {
    const letter = alphabetKeys[i];
    const headwords = Object.keys(indexObject[letter]);
    let counter = 1;
    for (let x = 0; x < headwords.length - 1; x++) {
      const currentHeadword = headwords[x];
      const currentRootHeadword = getRootHeadword(headwords[x]);
      const nextRootHeadword = getRootHeadword(headwords[x + 1]);
      if (currentRootHeadword === nextRootHeadword) {
        indexObject[letter][currentHeadword].counter_value = counter;
        counter++;
      } else if (x > 0) {
        const previousRootHeadword = getRootHeadword(headwords[x - 1]);
        if (currentRootHeadword === previousRootHeadword) {
          indexObject[letter][currentHeadword].counter_value = counter;
          counter = 1;
        }
      }
    }
  }

  // count number of unique locators per headword

  let locatorCountHeadwordsList = [];
  const alphabetList = Object.keys(indexObject);
  for (let i = 0; i < alphabetList.length; i++) {
    const letter = alphabetList[i];
    const letterObject = indexObject[letter];
    const headwordArray = Object.keys(letterObject);

    for (let x = 0; x < headwordArray.length; x++) {
      const headword = headwordArray[x];
      let allLocators = [];
      const headwordObject = letterObject[headword];
      const subheadArray = Object.keys(headwordObject);
      for (let y = 0; y < subheadArray.length; y++) {
        const subhead = subheadArray[y];
        const subheadObject = headwordObject[subhead];
        allLocators.push(subheadObject.locators);
      }
      const uniqueLocatorsLength = [...new Set(allLocators.flat())].length;
      if (uniqueLocatorsLength > 0) {
        locatorCountHeadwordsList.push([headword, uniqueLocatorsLength]);
      }
    }
  }
  locatorCountHeadwordsList.sort(function (a, b) {
    return a[1] - b[1];
  });
  locatorCountHeadwordsList.reverse();

  const object = `export const indexObject =${JSON.stringify(indexObject, null, 5)}`;
  try {
    fs.writeFileSync("src/data/index-object.js", object);
    console.info("✅ indexObject written");
  } catch (err) {
    console.error("❌There was an error writing indexObject");
    console.error(err);
  }

  const headwordLocatorCount = `export const headwordLocatorCount =${JSON.stringify(locatorCountHeadwordsList, null, 5)}`;

  try {
    fs.writeFileSync("src/data/headwordLocatorCount.js", headwordLocatorCount);
    console.info("✅ headwordLocatorCount written");
  } catch (err) {
    console.error("❌There was an error writing headwordLocatorCount");
    console.error(err);
  }

  let headwordLocatorCountHtml = openingHtmlheadwordLocatorCountHtml;

  headwordLocatorCountHtml += `<div class="table">`;
  for (let i = 0; i < locatorCountHeadwordsList.length; i++) {
    headwordLocatorCountHtml += `
    <div class="row">
    <div class="headword">${locatorCountHeadwordsList[i][0]}</div>
    <div class="count">${locatorCountHeadwordsList[i][1]}</div>
    </div>`;
  }
  headwordLocatorCountHtml += `
  <div>
  </body>`;

  try {
    fs.writeFileSync("public/locatorCountTable.html", headwordLocatorCountHtml);
    console.info("🌐 headwordLocatorCountHTML written");
  } catch (err) {
    console.error("❌There was an error writing headwordLocatorCountHTML");
    console.error(err);
  }

  // ---------- S T A T S --------------
  // count total unique locators
  const allLocatorsArray = [];
  for (let i = 0; i < rawIndexArray.length - 1; i++) {
    const locator = rawIndexArray[i][2].trim();
    if (!locator.match(/xref/)) {
      allLocatorsArray.push(locator);
    }
  }

  const alphabetLetters = Object.keys(indexObject);

  let xrefsCount = 0;
  for (let i = 0; i < alphabetLetters.length; i++) {
    const thisLetterObject = indexObject[alphabetLetters[i]];
    const thisLetterHeadKeys = Object.keys(thisLetterObject);
    for (let x = 0; x < thisLetterHeadKeys.length; x++) {
      const headWord = thisLetterHeadKeys[x];
      const headwordObject = thisLetterObject[thisLetterHeadKeys[x]];
      const subheads = Object.keys(headwordObject);
      const xrefObject = thisLetterObject[headWord][""];
      if (xrefObject) {
        const pureXrefTest = headwordObject[""].locators;
        if (subheads.length === 1 && pureXrefTest.length === 0) xrefsCount++;
      }
    }
  }

  const totalUniqueLocatorsLength = [...new Set(allLocatorsArray.flat())].length;
  console.info(`#️⃣  Total unique locators: ${totalUniqueLocatorsLength}`);

  // uniqueLocators.js needs to be fixed for React app

  try {
    fs.writeFileSync("src/data/statsData.js", `export const statsData ={ uniqueLocators: ${totalUniqueLocatorsLength}, xrefsCount: ${xrefsCount}}`);
  } catch (err) {
    console.error("❌There was an error writing total unique locators");
    console.error(err);
  }

  // end of total unique locators

  (async () => {
    try {
      const module = await import("./src/functions/createSuttaIndexHtml.js");
      const createSuttaIndexHtml = module.default; // Access the default export
      createSuttaIndexHtml(indexObject);
    } catch (err) {
      console.error("Error loading module:", err);
    }
  })();

  (async () => {
    try {
      const moduleVanilla = await import("./src/functions/createSuttaIndexHtml-vanilla.js");
      const createSuttaIndexHtmlVanilla = moduleVanilla.default; // Access the default export
      createSuttaIndexHtmlVanilla(indexObject);
    } catch (err) {
      console.error("Error loading module:", err);
    }
  })();
}

function createHeadingsArray() {
  function makeArrayOfXrefs(rawIndexArray) {
    for (let i = 0; i < rawIndexArray.length; i++) {
      if (/xref/.test(rawIndexArray[i][2])) xrefArray.push(rawIndexArray[i][2].replace("xref ", "").replace("\r", ""));
    }
  }

  let listOfHeadwords = [];
  for (let i = 0; i < alphabetKeys.length; i++) {
    const headwords = Object.keys(indexObject[alphabetKeys[i]]);
    listOfHeadwords.push(headwords);
  }
  listOfHeadwords = listOfHeadwords.flat();

  findNonUniqueHeadwords(listOfHeadwords);

  const headwordsArray = `export const headwordsArray =${JSON.stringify(listOfHeadwords, null, 5)}`;

  try {
    fs.writeFileSync("src/data/headwords-array.js", headwordsArray);
    console.info("✅ headwordsArray written");
  } catch (err) {
    console.error("❌There was an error writing headwordsArray");
    console.error(err);
  }

  makeArrayOfXrefs(rawIndexArray);

  //go through xrefArray and make sure that each one appears in the list of headwords
  for (let i = 0; i < xrefArray.length; i++) {
    if (!headwordsArray.includes(xrefArray[i].trim())) {
      console.error(`❌  ${xrefArray[i]} is not a valid xref`);
    }
  }
}

function createLocatorSortedArray() {
  for (let i = 0; i < rawIndexArray.length - 1; i++) {
    if (!/xref/.test(rawIndexArray[i][2]) && !/CUSTOM/.test(rawIndexArray[i][2])) {
      locatorFirstArray.push([rawIndexArray[i][2].replace(/\r/, ""), rawIndexArray[i][0], rawIndexArray[i][1]]);
    }
  }

  locatorFirstArray = locatorFirstArray.sort(natsort());

  // test for blank locator field
  for (let i = 0; i < locatorFirstArray.length; i++) {
    if (locatorFirstArray[i][0] === "") {
      console.error(`❌ Missing Locator, Head: ${locatorFirstArray[i][1]}; Sub: ${locatorFirstArray[i][2] ? locatorFirstArray[i][2] : "blank"}`);
    }
    if (!/(DN|MN|SN|AN|Kp|Dhp|Ud|Iti|Snp|Vv|Pv|Thag|Thig|xref)/.test(locatorFirstArray[i][0])) {
      console.error(`❌ Bad citation or xref:${locatorFirstArray[i][0] ? locatorFirstArray[i][0] : "blank"}; Head: ${locatorFirstArray[i][1]}; Sub: ${locatorFirstArray[i][2] ? locatorFirstArray[i][2] : "blank"}`);
    }
  }

  // test for blank subheads
  let blankSubheads = 0;
  for (let i = 0; i < locatorFirstArray.length; i++) {
    if (locatorFirstArray[i][2] === "~") blankSubheads++;
  }

  const array = `export const indexArray =${JSON.stringify(locatorFirstArray, null, 5)}`;

  try {
    fs.writeFileSync("src/data/index-array.js", array);
    console.info(`✅ indexArray written with ⫷ ${blankSubheads}⫸ blank subheads`);
  } catch (err) {
    console.error("❌There was an error writing indexArray");
    console.error(err);
  }
}

function createLocatorBookObject() {
  const locatorBookObject = {
    DN: [],
    MN: [],
    SN: [],
    AN: [],
    Kp: [],
    Dhp: [],
    Ud: [],
    Iti: [],
    Snp: [],
    Vv: [],
    Pv: [],
    Thag: [],
    Thig: [],
  };

  function findBook(citation) {
    return citation.match(/(DN|MN|SN|AN|Kp|Dhp|Ud|Iti|Snp|Vv|Pv|Thag|Thig|xref)/)[0];
  }

  for (let i = 0; i < locatorFirstArray.length; i++) {
    const book = findBook(locatorFirstArray[i][0]);
    locatorBookObject[book].push(locatorFirstArray[i]);
  }

  const locatorBookObjectString = `export const locatorBookObject =${JSON.stringify(locatorBookObject, null, 2)}`;

  try {
    fs.writeFileSync("src/data/locator-book-object.js", locatorBookObjectString);
    console.info("✅ locatorBookObject written");
  } catch (err) {
    console.error("❌There was an error writing locatorBookObject");
    console.error(err);
  }
  createLocatorSortedTableHtml(locatorBookObject);
}

console.info("▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼");
logTsvCreationDate();
createIndexObject();
createLocatorSortedArray();
createHeadingsArray();
createLocatorBookObject();
createDate();
