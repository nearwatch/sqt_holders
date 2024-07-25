const template = '<div style="alignItems:center; display:flex; flexDirection:column; justifyContent:center; width:100%; padding:30px; margin:20px; border:1px solid #e0e0e0; border-radius:5px; box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);"><div style="fontSize:70; fontWeight:bold; color:black; textAlign:center;">%title%</div><div style="margin-top:10px; fontSize:36; maxWidth:1000px; textAlign:center;">%description%</div></div>'

async function getPrice() {
  try{
    const res = await fetch('https://api.cryptorank.io/v0/coins/prices?keys=subquery&currency=USD', {headers:{'Content-Type':'application/json', Origin:"https://cryptorank.io", Referer:"https://cryptorank.io/"}})
    if (!res.ok) return ({error:res.statusText+' ('+res.status+')'})
    const data = await res.json()
    return data?.data[0]?.price
  }catch(error){
    return {error}
  }
}
async function getData() {
  try{
    const query = 'query  {tokenHolders(first:10, orderBy:BALANCE_DESC filter:{tokenId:{equalTo:"0x858c50C3AF1913b0E849aFDB74617388a1a5340d"}}) {edges {node {id balance}}}}'
    const res = await fetch('https://api.subquery.network/sq/subquery/subquery-mainnet', {method:'POST', headers: {'Content-Type':'application/json'}, body:JSON.stringify({query})})
    if (!res.ok) return ({error:res.statusText+' ('+res.status+')'})
    const data = await res.json()
    return data?.data.tokenHolders.edges?.map(e => e.node)
  }catch(error){
    return {error}
  }
}
function def_screen(title, decription){
  return {
  html: template.replace(/%title%/g, title).replace(/%description%/g, decription),
    post_url: '?step=data',  
    page_html: '<script>window.location="'+'https://warpcast.com/~/compose?embeds[]='+process.env.DOMAIN+'"</script>',
    buttons: [
      {label:'Start', action:'post'},
      {label:'SubQuery', action:'link', target:'https://subquery.network'},
      {label:'Share', action:'link', target:'https://warpcast.com/~/compose?embeds[]='+process.env.DOMAIN}
    ]
  }
}
function format(sqt, price){
  const sqt_val = +sqt.substr(0,sqt.length-18)+Math.round(parseFloat('0.'+sqt.substr(-18)))
  return sqt_val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+' SQT ($'+Math.round(sqt_val*price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")+')'
}
exports.getParams = async (query, payload) => {
  const button = payload?.untrustedData.buttonIndex || 3
  let ptr = query?.ptr ? +query?.ptr : 1
  let state = payload?.untrustedData.state && JSON.parse(Buffer.from(payload.untrustedData.state,'base64'));
  switch (query?.step) {
    case 'data':
      if (!state){
        const price = await getPrice()
        const data  = await getData()
        if (!price || price?.error || !data || data?.error) return def_screen(title, price?.error || data?.error || 'Something went wrong')
        state = {price, data}
      }
      ptr = ptr+(button-2)
      if (ptr < 0) ptr = state.data.length-1
      if (ptr >= state.data.length) ptr = 0
      return {
        html: template.replace(/%title%/g,format(state.data[ptr].balance, state.price)).replace(/%description%/g,(ptr+1)+'. '+state.data[ptr].id),
        state: Buffer.from(JSON.stringify(state)).toString('base64'),
        post_url: '?step=data&ptr='+ptr,  
        page_html: '<script>window.location="'+'https://warpcast.com/~/compose?embeds[]='+process.env.DOMAIN+'"</script>',
        buttons: [
          {label:'Prev', action:'post'},
          {label:'BaseScan', action:'link', target:'https://basescan.org/token/0x858c50C3AF1913b0E849aFDB74617388a1a5340d?a='+state.data[ptr].id},
          {label:'Next', action:'post'},
        ]
      }
    default: return def_screen('Top 10 SQT holders', '')
  }
}
