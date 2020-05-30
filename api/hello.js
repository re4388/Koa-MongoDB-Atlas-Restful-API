// module.exports = (req, res) => {
//     const { name = 'World' } = req.query
//     res.status(200).send(`Hello ${name}!`)
// }

module.exports = async(req, res) => {
    const { body } = req
    res.end(`Hello ${body.name}, you just parsed the request body!`)
}