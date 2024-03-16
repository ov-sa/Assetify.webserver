let cache = {}, trash = {}
let getIP = (ip) => ip ? ip?.replace(/^.*:/, '') : false

Assetify.rest.create("post", "onSetConnection", (request, response, stream) => {
    const requestIP = getIP(request.ip)
    let streamed = {}
    stream.on("field", (index, value) => {streamed[index] = value})
    stream.on("close", () => {
        if (streamed.state == true) {
            cache[requestIP] = {token: vKit.vid.create(), peer: {}, content: trash[requestIP] ? trash[requestIP].content : {}}
            if (trash[requestIP]) {
                clearTimeout(trash[requestIP].expiry)
                delete trash[requestIP]
            }
        }
        else {
            if (cache[requestIP]) {
                trash[requestIP] = {content: cache[requestIP].content}
                trash[requestIP].expiry = vKit.scheduleExec(() => delete trash[requestIP], 30*60*1000)
            }
            delete cache[requestIP]
        }
        response.status(200).send(cache[requestIP].token)
        vKit.print(`\x1b[33m━ Assetify (Server) | \x1b[32mServer: ${requestIP} ${cache[requestIP] ? "connected" : "disconnected"}.\x1b[37m`)
    })
})

Assetify.rest.create("post", "onSyncPeer", (request, response, stream) => {
    var [_, query] = request.url.split("?")
    const requestIP = getIP(request.ip)
    request = vKit.query.parse(query)
    let streamed = {}
    stream.on("field", (index, value) => {streamed[index] = value})
    stream.on("close", () => {
        if (!cache[requestIP] || !request.token || (request.token != cache[requestIP].token) || !streamed.peer) return response.status(401).send(false)
        if (streamed.state == true) cache[requestIP].peer[(streamed.peer)] = true
        else delete cache[requestIP].peer[(streamed.peer)]
        response.status(200).send(true)
        vKit.print(`\x1b[33m━ Assetify (Server) | \x1b[32mPeer: ${streamed.peer} ${cache[requestIP].peer[(streamed.peer)] ? "connected" : "disconnected"}. \x1b[33m[Server: ${requestIP}]\x1b[37m`)
    })

})

Assetify.rest.create("post", "onVerifyContent", (request, response, stream) => {
    var [_, query] = request.url.split("?")
    const requestIP = getIP(request.ip)
    request = vKit.query.parse(query)
    let streamed = {}
    stream.on("field", (index, value) => {streamed[index] = value})
    stream.on("close", () => {
        if (!cache[requestIP] || !request.token || (request.token != cache[requestIP].token) || !streamed.path || !streamed.hash) return response.status(401).send(false)
        let isVerified = cache[requestIP].content[(streamed.path)] && (streamed.hash.toLowerCase() == vKit.crypto.createHash("sha256").update(cache[requestIP].content[(streamed.path)]).digest("hex").toLowerCase()) ? true : false
        if (!isVerified) delete cache[requestIP].content[(streamed.path)]
        response.status(200).send(isVerified)
    })
})

Assetify.rest.create("post", "onSyncContent", (request, response, stream) => {
    var [_, query] = request.url.split("?")
    const requestIP = getIP(request.ip)
    request = vKit.query.parse(query)
    let streamed = {}
    stream.on("field", (index, value) => {streamed[index] = value})
    stream.on("close", () => {
        if (!cache[requestIP] || !request.token || (request.token != cache[requestIP].token) || !streamed.path || !streamed.content) return response.status(401).send(false)
        cache[requestIP].content[(streamed.path)] = streamed.content
        vKit.print(`\x1b[33m━ Assetify (Server) | \x1b[32mContent: ${streamed.path} synced. \x1b[33m[Server: ${requestIP}]\x1b[37m`)
        response.status(200).send(true)
    })
})

Assetify.rest.create("get", "onFetchContent", async (request, response) => {
    var [_, query] = request.url.split("?")
    request = vKit.query.parse(query)
    let requestIP = false
    if (request && request.token) {
        for (let i in cache) {
            if (request.token == cache[i].token) {
                requestIP = i
                break
            }
        }
    }
    if (!requestIP || !request.peer || !cache[requestIP].peer[(request.peer)] || !request.path || !cache[requestIP].content[(request.path)]) return response.status(401).send(false)
    await cache[requestIP].content[(request.path)].sync
    response.status(200).send(cache[requestIP].content[(request.path)])
})