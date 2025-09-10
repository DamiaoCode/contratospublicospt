import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const nipc = searchParams.get('nipc')

  if (!nipc) {
    return NextResponse.json(
      { error: 'NIPC é obrigatório' },
      { status: 400 }
    )
  }

  try {
    const viesUrl = `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/PT/vat/${nipc.trim()}`
    
    const response = await fetch(viesUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ConcursoPublico/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`VIES API error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao consultar VIES API:', error)
    return NextResponse.json(
      { error: 'Erro ao consultar o NIPC. Verifique se o número está correto e tente novamente.' },
      { status: 500 }
    )
  }
}
