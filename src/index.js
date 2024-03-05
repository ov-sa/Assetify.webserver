module.exports = (config) => {
    config = vKit.isObject(config) ? config : {}
    (async () => {
        require("@vstudio/vital.network")
        vKit.print("\x1b[33m━ Assetify (Server) | Launching...")
        let Assetify = vNetwork.create({
            port: vKit.Number(config.port) || 33022,
            isCaseSensitive: true
        })
        if (!await Assetify.connect()) return vKit.print("\x1b[33m━ Assetify (Server) | \x1b[31mFailed to launch due to technical issues...\x1b[31m")
        vKit.global.Assetify = Assetify
        require("./api")
        vKit.print("\x1b[33m━ Assetify (Server) | Launched successfully!\x1b[31m")
    })()
}