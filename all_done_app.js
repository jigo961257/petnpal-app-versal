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
    async (req, res) => {
        const files = req.files
        console.log(files);
        let filename = "";
        Object.keys(files).forEach(key => {
            const filesPath = path.join(__dirname, "files", files[key].name)
            filename = files[key].name
            files[key].mv(filesPath, (err) => {
                if (err) return res.status(500).json({ status: 500, message: "file not upload prperly" })
            })
        })
        if (filename.length > 4) {
            action_perform.call_forPerfomr_task(filename).then((ans) => {
                console.log(ans);
            });
            
            // console.log("output: ", output);
            // file_obj = output;
            return res.json({ status: 200, message: "upload done, file proccess done" })
        }
        return res.json({ status: 200, message: "uplod done, file process" })
     
    }
)

app.get("/resdownload", (req, res) => {
    console.log(file_obj);
    // setTimeout(() => {
    //     return res.download(path.join(__dirname,"files/" + file_obj.output_file))
    // }, 500);

    // return res.json({ status: 200, message: "file download" })
    res.download(__dirname+"/files/"+"ans.xlsx", (err) => {
        if(err)
        {
            console.log(err);
        } else {
            action_perform.removeFile(__dirname+"/files/"+"ans.xlsx");
        }
    })
})


app.listen(PORT, () => console.log("service is running"))