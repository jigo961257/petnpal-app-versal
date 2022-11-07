const path = require("path")

const fileExtLimeter = (allowedExtArry) => {
    return (req, res, next) => {
        const files = req.files 

        const fileExtentions = [];
        Object.keys(files).forEach(key => {
            fileExtentions.push(path.extname(files[key].name))
        })

        //  are the file exteddio n is allowd
        const allowd = fileExtentions.every(ext => allowedExtArry.includes(ext));

        if(!allowd){
            const message = 'upload file is not supported'
            return res.status(422).json({status :"error", message})
        }
        next()
    }
}

module.exports = fileExtLimeter