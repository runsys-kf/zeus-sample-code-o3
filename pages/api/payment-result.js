// pages/api/payment-result.js
import axios from 'axios';
import { Builder, parseStringPromise } from 'xml2js';

const ZEUS_ENDPOINT = 'https://linkpt.cardservice.co.jp/cgi-bin/secure/api.cgi';
const builder = new Builder({ headless: true });

export default async function handler(req, res) {
  const { step, md, PaRes } = req.body;

  let reqObj;
  if (step === 'auth') {
    reqObj = {
      request: {
        $:{ service:'secure_link_3d', action:'authentication' },
        xid: md,
        PaRes: PaRes
      }
    };
  } else if (step === 'payment') {
    reqObj = {
      request: {
        $:{ service:'secure_link_3d', action:'payment' },
        xid: md,
        print_am: 'yes',
        print_addition_value: 'yes'
      }
    };
  } else {
    return res.status(400).json({ error: 'invalid step' });
  }

  const xml = '<?xml version="1.0" encoding="utf-8"?>' + builder.buildObject(reqObj);
  const zres = await axios.post(ZEUS_ENDPOINT, xml, {
    headers: { 'Content-Type':'application/xml' }
  });
  const parsed = await parseStringPromise(zres.data);
  return res.status(200).json(parsed.response);
}
