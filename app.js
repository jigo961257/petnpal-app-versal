const express = require("express");
const fileupload = require("express-fileupload");
const path = require("path");

const action_perform = require("./action_perform");
const filePayloadExist = require("./middleware/filePayloadExist");
const fileExtLimeter = require("./middleware/fileExtLimeter");
const PORT = process.env.PORT || 3500;
const app = express();

const zip = require('express-zip');

let file_obj = null;
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})

app.post("/upload",
    fileupload({ createParentPath: true }),
    filePayloadExist,
    fileExtLimeter(['.xlsx']),
    (req, res) => {
        const files = req.files
        console.log(files);
        let filename = "";
        Object.keys(files).forEach(key => {
            console.log("this-> ", key);
            let movefile = new Promise((resolve, reject) => {
                const filesPath = path.join(__dirname, "files", files[key].name)
                filename = files[key].name
                console.log(filename);
                files[key].mv(filesPath, (err) => {
                    if (err) {
                        reject(new Error("faild to upload"))
                    } else {
                        resolve(true)
                    }
                })
            })
            movefile.then(async (ans) => {
                if (ans) {
                    // res.json({ status: 200, message: "file is save" })
                    let performAction = new Promise(async (resolve, reject) => {
                        let ans = await action_perform.call_forPerfomr_task(filename);
                        console.log(ans);
                        if (ans.status) {
                            resolve(true)
                        } else {
                            reject(new Error("erro : while perfoem action : ", ans.err))
                            res.json({ status: 400, message: "file process not done while some probel" })
                        }
                    })
                    await performAction.then((per_ans) => {
                        if (per_ans) {
                            console.log("the perform action is done");
                            res.json({ status: 200, message: "file process done", download: true })
                        } 
                    })
                }
            }).catch((err) => {
                console.log(err);

            })
        })
        // Object.keys(files).forEach(key => {
        //     const filesPath = path.join(__dirname, "files", files[key].name)
        //     filename = files[key].name
        //     files[key].mv(filesPath, (err) => {
        //         if (err) return res.status(500).json({ status: 500, message: "file not upload prperly" })
        //     })
        // })
        // if (filename.length > 4) {
        //     // action_perform.call_forPerfomr_task(filename).then((msg) => {
        //     //     console.log("msg: ", msg);
        //     //     res.type("text/plain").send("this isjigo");
        //     // })
        // }
        // console.log("finished tasks:", Date.now()-requestTime, "ms");
        // return res.json({ status: 200, message: "uplod done, file process" })

    }
)

app.get("/resdownload", (req, res) => {
    console.log("file_obj", file_obj);
    // setTimeout(() => {
    //     return res.download(path.join(__dirname,"files/" + file_obj.output_file))
    // }, 500);

    // res.json({ status: 200, message: "file download" })
    res.download(path.join(__dirname,"files/" + "ans.xlsx"), (err) => {
        if (err) {
            console.log(err);
        }
    })
})


app.listen(PORT, () => console.log("service is running"))