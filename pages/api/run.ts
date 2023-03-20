import { NextApiRequest, NextApiResponse } from 'next';

export default function runHandler(request: NextApiRequest, response: NextApiResponse) {
  console.log(`--- run ---`)
  console.log(request.body)
}
