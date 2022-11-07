const xlsAll = require("xlsx");
const path = require("path");
const puppeteer = require("puppeteer")
// const { unlink } = require("node:fs/promises")
const fs = require("fs");


const delay = ms => new Promise(
    resolve => setTimeout(resolve, ms)
);

async function call_forPerfomr_task(filename) {
    console.log(filename);
    if (!filename) {
        return { status: false, err: "file is missing" }
    }
    let file_withpath = path.join(__dirname, "files/" + filename);
    await delay(1000);
    const read_excel_wb = xlsAll.readFile(file_withpath, { type: "file" });

    console.log(read_excel_wb.SheetNames);

    let count = 0;
    let b_summary = [], b_disc_of_figure = [], d_discription = [], d_abstract = [];
    const new_workBook = xlsAll.utils.book_new()
    // first check the worksheet their is any preset the worksheet or not called patenpal
    let isWorkSheetIsPreset = new_workBook.SheetNames.find(el => el === "patenpal");
    if (isWorkSheetIsPreset === undefined) {
        let data = [["Code", "Brife Summary", "Brife Discription of Figure", "Detailed DescriptionS", "Abstract", "Status", "Claim"]]
        let worksheet_new = xlsAll.utils.aoa_to_sheet(data);
        xlsAll.utils.book_append_sheet(new_workBook, worksheet_new, "patenpal");
        console.table(new_workBook.SheetNames);

    }

    // here store the allsheet in to one object
    let worksheets = {}
    for (const sheetname of new_workBook.SheetNames) {
        worksheets[sheetname] = xlsAll.utils.sheet_to_json(new_workBook.Sheets[sheetname])
    }
    let worksheets_1 = {}
    for (const sheetname of read_excel_wb.SheetNames) {
        worksheets_1[sheetname] = xlsAll.utils.sheet_to_json(read_excel_wb.Sheets[sheetname])
    }
    // return
    // let raw_worksheet_data = worksheets.Raw;
    let raw_worksheet_data = xlsAll.utils.sheet_to_json(read_excel_wb.Sheets["Raw"]);
    console.log(worksheets_1.Raw);
    let paraphrase_worksheet_data = worksheets.patenpal;

    let raw_worksheet_data_len = worksheets_1.Raw.length;


    console.log(raw_worksheet_data_len);
    

    async function goToPage_login() {

        try {
            const broweser = await puppeteer.launch({
                headless: false,
                // executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",

            });
            const page = await broweser.newPage()
            await page.goto("https://draft.patentpal.com/", { waitUntil: "domcontentloaded" }).then(async (res) => {
                // await page.waitForNavigation()
                const getLoginForm = "#login";
                await page.waitForSelector(getLoginForm).then(async () => {
                    await page.type("#input-15", "jignesh@jtattorneyalliance.com", { delay: 0 })
                    await page.type("#input-19", "Jitu1@jtaa", { delay: 0 });

                    await page.click("span[class='v-btn__content']").then(async () => {
                        // actionPerfomr()
                        const theBlankDoc = ".box.blankDocument"
                        await page.waitForSelector(theBlankDoc).then(async () => {
                            await page.click(theBlankDoc).then(async () => {

                                let i = 0;

                                while (i !== raw_worksheet_data_len) {

                                    const getClaimBox = "#quill-claims"
                                    await page.waitForSelector(getClaimBox).then(async () => {
                                        await page.click(getClaimBox).then(async () => {

                                            const claimTextBox = "#quill-claims > div.ql-editor"
                                            await page.waitForSelector(claimTextBox).then(async () => {
                                                await page.evaluate((claim_data, i) => {
                                                    let input_text_box = document.querySelector("#quill-claims > div.ql-editor");
                                                    input_text_box.textContent = claim_data[i].Claim;
                                                }, raw_worksheet_data, i).then(async () => {
                                                    const getClickButton = ".arrowButton"
                                                    await page.waitForSelector(getClickButton).then(async () => {
                                                        await page.click(getClickButton).then(async () => {
                                                            const letWaitUntilDownloadVisiable = "button[class='v-btn v-btn--text theme--light v-size--default']"
                                                            await page.waitForSelector(letWaitUntilDownloadVisiable).then(async () => {
                                                                let final_output_data = await page.evaluate((c, b_sum, b_dis_fig, d_dis, d_abs) => {
                                                                    let element = document.querySelector("#quill-description div.ql-editor").children;
                                                                    for (let i = 0; i < element.length; i++) {
                                                                        if (element[i].tagName == "H2") {
                                                                            c += 1;
                                                                        } else if (element[i].tagName === "P" && c == 1) {
                                                                            b_sum.push(element[i].textContent)
                                                                        } else if (element[i].tagName === "P" && c == 2) {
                                                                            b_dis_fig.push(element[i].textContent)
                                                                        } else if (element[i].tagName === "P" && c == 3) {
                                                                            d_dis.push(element[i].textContent)
                                                                        } else if (element[i].tagName === "P" && c == 4) {
                                                                            d_abs.push(element[i].textContent)
                                                                        } else {
                                                                            c = 0;
                                                                        }
                                                                    }
                                                                    let res_obj = {}
                                                                    res_obj.b_sum = b_sum.toString()
                                                                    res_obj.b_dis_fig = b_dis_fig.toString()
                                                                    res_obj.d_dis = d_dis.toString()
                                                                    res_obj.d_abs = d_abs.toString()
                                                                    return res_obj
                                                                }, count, b_summary, b_disc_of_figure, d_discription, d_abstract);

                                                                paraphrase_worksheet_data.push({
                                                                    "Code": raw_worksheet_data[i].Code,
                                                                    "Brife Summary": final_output_data.b_sum,
                                                                    "Brife Discription of Figure": final_output_data.b_dis_fig,
                                                                    "Detailed Description": final_output_data.d_dis,
                                                                    "Abstract": final_output_data.d_abs,
                                                                    "Claim": raw_worksheet_data[i].Claim                                                                    ,
                                                                    "Status": true,
                                                                })

                                                                final_output_data = null
                                                            });
                                                        });
                                                    });
                                                })
                                                // return

                                            });
                                        })
                                    });
                                    console.log("current text pick = ", i);
                                    i++;
                                    console.log("now text pick = ", i);
                                    await delay(5000);
                                }
                                console.log(paraphrase_worksheet_data);
                                // return;
                                xlsAll.utils.sheet_add_json(new_workBook.Sheets["patenpal"], paraphrase_worksheet_data)
                                xlsAll.writeFile(new_workBook, path.join(__dirname, "files/" + "ans.xlsx"), { type: "file", bookType: "xlsx" });
                                removeFile(path.join(__dirname, "files/" + filename))
                                await broweser.close();

                            });
                        });
                    });
                })

            })
            console.log("All row is done");
            
        } catch (error) {
            console.log("error:\n", error);
        }
    }
    await goToPage_login();
    return { status: true, filename: "ans.xlsx" }
}

async function call_smaple_action() {
    console.log("call_smaple_action");
    await delay(3000);
    console.log("call_smaple_action respose ");
    return { status: true }
}

function removeFile(filename) {
    (async function (path) {
        try {
            await fs.unlinkSync(path);
            console.log(`successfully deleted ${path}`);

        } catch (error) {
            console.error('there was an error:', error.message);
        }
    })(filename);
}


module.exports = {
    call_forPerfomr_task,
    removeFile,
    call_smaple_action
}