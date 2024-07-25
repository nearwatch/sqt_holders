const dotenv  = require('dotenv').config()
const satori  = require('satori').default
const parse   = require('html-react-parser').default
const {Resvg} = require('@resvg/resvg-js')
const express = require('express')
const bparser = require('body-parser')
const frame   = require('./frame.js')
const cache   = require('./cache.js')
const {fonts, fontFiles} = require('./fonts.js' )

async function toImage(element, square, width=1200, is_svg, no_cache){
  const key = cache.getHash(element+width+square)
  let cached = cache.getCache(key)
  if (cached) return cached.base64 ? cached.base64 : process.env.DOMAIN+'/images/'+key
  let svg = element
  if (!is_svg){
    const options = {width, height:square?width:Math.round(width/1.91), fonts, debug:false } 
    const dom = parse('<div style="width:'+width+'; height:'+options.height+'; display:flex; alignItems:stretch">'+element+'</div>')
    svg = await satori(dom, options)
  }
  const options = {
    background: 'rgba(255,255,255,.9)', 
    font: {defaultFontFamily:'Roboto', fontFiles, loadSystemFonts:false},
  }
  if (width!=1200) options.fitTo = {mode:'width', value:width}
  const resvg = new Resvg(svg, options)
  const pngData = resvg.render()
  const png = pngData.asPng()
  cached = cache.saveFile(key, png, no_cache)
  return cached.base64 ? cached.base64 : process.env.DOMAIN+'/images/'+key
}
function generateMeta(params, meta = ''){
  if (params.title) 		meta += '<title>'+params.title+'</title><meta property="og:title" content="'+params.title+'"/>'
  if (params.description) meta += '<meta property="og:description" content="'+params.description+'"/>'
  meta += '<meta property="og:image" content="'+params.image+'"/>'
  meta += '<meta property="fc:frame" content="vNext"/>' 
  meta += '<meta property="fc:frame:image" content="'+params.image+'"/>'
  meta += '<meta property="fc:frame:image:aspect_ratio" content="'+(params.square?'1:1':'1.91:1')+'"/>'
  if (params.post_url) meta += '<meta property="fc:frame:post_url" content="'+params.post_url+'"/>'
  if (params.state) meta += '<meta property="fc:frame:state" content="'+params.state+'"/>'
  if (params.input) meta += '<meta property="fc:frame:input:text" content="'+params.input+'"/>'
    if (params.buttons) {
    for (let i=0; i<params.buttons.length; i++){
      meta += '<meta property="fc:frame:button:'+(i+1)+'" content="'+params.buttons[i].label+'"/>'
      if (params.buttons[i].action) meta += '<meta property="fc:frame:button:'+(i+1)+':action" content="'+params.buttons[i].action+'"/>'
      if (params.buttons[i].target) meta += '<meta property="fc:frame:button:'+(i+1)+':target" content="'+params.buttons[i].target+'"/>'
    }
  }
  return meta
}
async function request(req, res){
  const query = req.query ? JSON.parse(JSON.stringify(req.query)) : null
  if (query.redirect_url) return (res.writeHead(302,{Location:query.redirect_url, 'Content-Type':'text/html'}), res.end())
  let params
  try{
    params = await frame.getParams(query, req.method == "POST" ? req.body : null)
    params.image = params.gif || params.png || await toImage(params.svg || params.html, params.square, params.width, params.svg?1:0, params.no_cache)
    if (params.post_url != undefined) params.post_url = process.env.DOMAIN+'/'+(params.post_url?params.post_url:'')
    let page_html = '<body>'+(params.page_html?params.page_html:'<h2><code>Farcaster Frame Server</code></h2>')+'</body>'
    res.writeHead(200, {'Content-Type':'text/html', 'Cache-Control':'public, max-age='+(params.age!=undefined?params.age:864000)+', must-revalidate'})
    res.end('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=0.7">'+generateMeta(params)+'</head>'+(req.method == "POST"?'':page_html)+'</html>')
  }catch(err){
    console.log(err)
    res.writeHead(400)
    res.end('Something went wrong')
  }
}
const server = express()
server.use(bparser.json())
server.get('/images/:image', cache.sendFile)
server.get('/', request)
server.post('/',request)
server.listen(3000, err => console.log(err?err:'frame server running ...'))
module.exports = server
