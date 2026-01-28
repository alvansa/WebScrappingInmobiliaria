

function logToRenderer(window,msg) {
    if(window){
        window.webContents.send('message-renderer', msg)
    }
}


module.exports = {
    logToRenderer
}