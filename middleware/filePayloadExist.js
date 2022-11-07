const filePayloadExist = (req, res, next) => {
    if (!req.files) return res.status(400).json({ status: 400, message: "file not selected" })

    next()
}

module.exports = filePayloadExist