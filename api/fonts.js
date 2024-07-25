const fs    = require('fs')
const path  = require('path')

exports.fonts  = [
  {name:"Roboto", 	data:fs.readFileSync(path.join(__dirname,'fonts','Roboto','Roboto-Bold.ttf')),   weight:700, style:"normal"},
  {name:"Roboto", 	data:fs.readFileSync(path.join(__dirname,'fonts','Roboto','Roboto-Regular.ttf')),weight:500, style:"normal"},
  {name:"Roboto", 	data:fs.readFileSync(path.join(__dirname,'fonts','Roboto','Roboto-Italic.ttf')), weight:500, style:"italic"},
  {name:"Roboto Black", data:fs.readFileSync(path.join(__dirname,'fonts','Roboto','Roboto-Black.ttf')),  weight:900, style:"normal"},
  {name:"Roboto Medium",data:fs.readFileSync(path.join(__dirname,'fonts','Roboto','Roboto-Medium.ttf')), weight:400, style:"normal"},
  {name:"Roboto Light", data:fs.readFileSync(path.join(__dirname,'fonts','Roboto','Roboto-Light.ttf')),  weight:300, style:"normal"},
  {name:"Noto Emoji",	data:fs.readFileSync(path.join(__dirname,'fonts','NotoEmoji-Regular.ttf')), 	 weight:500, style:"normal"},
]
exports.fontFiles = fs.readdirSync(path.join(__dirname,'fonts','Roboto')).filter(e => e.endsWith('.ttf')).map(e => path.join(__dirname,'fonts','Roboto',e)).concat([path.join(__dirname,'fonts','NotoEmoji-Regular.ttf')])
