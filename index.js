const axios = require('axios')
const _ = require('lodash')

const argoKey = 'ax6542sdru3217t4eesd9'
const argoVersion = '2.1.0'
const appCode = 'APF'
const appCompany = 'ARGO Software s.r.l. - Ragusa'
const argoEndpoint = 'https://www.portaleargo.it/famiglia/api/rest/'
const userAgent = ['Mozilla/5.0 (Windows NT 10.0 WOW64) AppleWebKit/537.36 ', '(KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36']
const schoolCode = 'SG18251'

const parse = {}

const header = {
  'x-key-app': argoKey,
  'x-version': argoVersion,
  'x-produttore-software': appCompany,
  'x-app-code': appCode,
  'user-agent': userAgent,
  'x-cod-min': schoolCode
}

const params = {
  _dc: new Date().getTime()
}

module.exports = {
  availableMethods: () => Object.keys(parse),
  login: async (username, password) => {
    const { status, data } = await axios({
      method: 'get',
      url: argoEndpoint + 'login',
      headers: {
        ...header,
        'x-user-id': username,
        'x-pwd': password
      },
      params
    })
    if (status === 200) return data.token
    else throw new Error(status)
  },
  scheda: async (token) => {
    const { data: [scheda] } = await axios({
      method: 'get',
      url: argoEndpoint + 'schede',
      headers: {
        ...header,
        'x-auth-token': token
      }
    })
    return {
      prgAlunno: scheda.prgAlunno,
      prgScuola: scheda.prgScuola,
      prgScheda: scheda.prgScheda
    }
  },
  call: async (token, prgAlunno, prgScuola, prgScheda, method, date = null) => {
    // Secondo le API fatte da hearot serve sto parametro date quindi boh, mi fido
    if (!date || !/(\d{4})-(\d{2})-(\d{2})/.test(date)) date = new Date().toISOString().substr(0, 10)

    const { status, data } = await axios({
      method: 'get',
      url: argoEndpoint + method,
      headers: {
        ...header,
        ...{
          'x-auth-token': token,
          'x-prg-alunno': prgAlunno,
          'x-prg-scheda': prgScheda,
          'x-prg-scuola': prgScuola
        }
      },
      params: {
        ...params,
        datGiorno: date
      }
    })
    if (status === 200) return parse[method](data)
    else throw new Error(status)
  }
}

/* Basta aggiungere una funzione all'oggetto parse --> deve avere esattamente il nome dell'api che viene richiamata sulle api di argo
   In automatico verrà chiamata quella funzione la quale riceverà come parametro il campo data della risposta di argo
   In automatico verrà aggiunto all'array di API disponibili da noi
 */

// Parse in versione alpha
parse.votigiornalieri = data => (_.groupBy(data.dati.map(obj => ({
  desMateria: obj.desMateria,
  decValore: obj.decValore,
  codVoto: obj.codVoto,
  datGiorno: obj.datGiorno,
  doesCount: !obj.desCommento.includes('non fa media')
})), 'desMateria'))
