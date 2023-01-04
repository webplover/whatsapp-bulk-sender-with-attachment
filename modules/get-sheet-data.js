import { readFileSync } from "fs";
import { read, utils } from "xlsx";

export default function getSheetData(path) {
  const buf = readFileSync(path);
  const file = read(buf);

  let data = [];

  const sheets = file.SheetNames;

  for (let i = 0; i < sheets.length; i++) {
    const temp = utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
    temp.forEach((res) => {
      data.push(res);
    });
  }

  return data;
}
