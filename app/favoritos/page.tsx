'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Favoritos() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [favoritedConcursos, setFavoritedConcursos] = useState<Set<string>>(new Set())
  const [concursos, setConcursos] = useState<any[]>([])
  const [isLoadingConcursos, setIsLoadingConcursos] = useState(false)
  const [activeTab, setActiveTab] = useState<'ativos' | 'expirados'>('ativos')
  const [expandedConcursos, setExpandedConcursos] = useState<Set<string>>(new Set())
  const [activeFavoritedCount, setActiveFavoritedCount] = useState(0)

  // Buscar favoritos do usuário
  const fetchUserFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return
      }

      const { data, error } = await supabase
        .from('Users_Settings')
        .select('favoritos')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar favoritos:', error)
        return
      }

      if (data?.favoritos) {
        setFavoritedConcursos(new Set(data.favoritos))
      }
    } catch (err) {
      console.error('Erro ao buscar favoritos:', err)
    }
  }

  // Buscar concursos favoritados
  const fetchFavoritedConcursos = async () => {
    if (favoritedConcursos.size === 0) {
      setConcursos([])
      return
    }

    setIsLoadingConcursos(true)
    try {
      const { data, error } = await supabase
        .from('Concursos')
        .select('*')
        .in('id', Array.from(favoritedConcursos))
        .order('data_envio', { ascending: false })

      if (error) {
        console.error('Erro ao buscar concursos favoritados:', error)
        return
      }

      setConcursos(data || [])
    } catch (err) {
      console.error('Erro ao buscar concursos favoritados:', err)
    } finally {
      setIsLoadingConcursos(false)
    }
  }

  // Função para alternar favorito
  const toggleFavorite = async (concursoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Usuário não autenticado')
        alert('Você precisa estar logado para favoritar concursos.')
        return
      }

      const isCurrentlyFavorited = favoritedConcursos.has(concursoId)
      
      const { data: userSettings, error: fetchError } = await supabase
        .from('Users_Settings')
        .select('favoritos')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações do usuário:', fetchError)
        return
      }

      let currentFavoritos = userSettings?.favoritos || []
      
      if (isCurrentlyFavorited) {
        currentFavoritos = currentFavoritos.filter((id: string) => id !== concursoId)
      } else {
        if (!currentFavoritos.includes(concursoId)) {
          currentFavoritos.push(concursoId)
        }
      }

      const { error: upsertError } = await supabase
        .from('Users_Settings')
        .upsert({
          user_id: user.id,
          favoritos: currentFavoritos
        })

      if (upsertError) {
        console.error('Erro ao atualizar favoritos:', upsertError)
        alert('Erro ao atualizar favoritos. Tente novamente.')
        return
      }

      setFavoritedConcursos(prev => {
        const newSet = new Set(prev)
        if (isCurrentlyFavorited) {
          newSet.delete(concursoId)
        } else {
          newSet.add(concursoId)
        }
        return newSet
      })

    } catch (err) {
      console.error('Erro inesperado ao favoritar:', err)
      alert('Erro inesperado. Tente novamente.')
    }
  }

  // Função para alternar expansão de detalhes
  const toggleExpansion = (concursoId: string) => {
    setExpandedConcursos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(concursoId)) {
        newSet.delete(concursoId)
      } else {
        newSet.clear()
        newSet.add(concursoId)
      }
      return newSet
    })
  }

  // Função para calcular favoritos ativos
  const calculateActiveFavoritedCount = () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    return concursos.filter(concurso => {
      if (!favoritedConcursos.has(concurso.id)) return false
      if (!concurso.prazo_propostas) return false
      
      const prazoDate = new Date(concurso.prazo_propostas)
      prazoDate.setHours(0, 0, 0, 0)
      
      return prazoDate >= hoje
    }).length
  }

  // Função para calcular tempo restante até o prazo
  const calculateTimeRemaining = (prazoPropostas: string) => {
    if (!prazoPropostas) return null
    
    const prazoDate = new Date(prazoPropostas)
    const hoje = new Date()
    const diffTime = prazoDate.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { text: 'Prazo expirado', color: 'text-red-600 bg-red-50' }
    } else if (diffDays === 0) {
      return { text: 'Expira hoje', color: 'text-orange-600 bg-orange-50' }
    } else if (diffDays === 1) {
      return { text: 'Expira amanhã', color: 'text-orange-600 bg-orange-50' }
    } else if (diffDays <= 7) {
      return { text: `Faltam ${diffDays} dias`, color: 'text-orange-600 bg-orange-50' }
    } else {
      return { text: `Faltam ${diffDays} dias`, color: 'text-green-600 bg-green-50' }
    }
  }

  // Verificar estado de autenticação
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsLoggedIn(true)
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário'
        setUserName(name)
      } else {
        setIsLoggedIn(false)
        setUserName('')
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setIsLoggedIn(true)
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário'
          setUserName(name)
        } else {
          setIsLoggedIn(false)
          setUserName('')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Carregar favoritos quando logado
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserFavorites()
    } else {
      setFavoritedConcursos(new Set())
    }
  }, [isLoggedIn])

  // Buscar concursos quando favoritos mudarem
  useEffect(() => {
    if (isLoggedIn) {
      fetchFavoritedConcursos()
    }
  }, [favoritedConcursos, isLoggedIn])

  // Atualizar contador de favoritos ativos
  useEffect(() => {
    const activeCount = calculateActiveFavoritedCount()
    setActiveFavoritedCount(activeCount)
  }, [concursos, favoritedConcursos])

  // Filtrar concursos por status
  const getFilteredConcursos = () => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return concursos.filter(concurso => {
      if (!concurso.prazo_propostas) return false
      
      const prazoDate = new Date(concurso.prazo_propostas)
      prazoDate.setHours(0, 0, 0, 0)

      if (activeTab === 'ativos') {
        return prazoDate >= hoje
      } else {
        return prazoDate < hoje
      }
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUserName('')
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Favoritos
            </h1>
            <p className="text-gray-600 mb-8">
              Faça login para ver seus concursos favoritos
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-4">
              <Link
                href="/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out"
              >
                Fazer Login
              </Link>
              
              <Link
                href="/signup"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out"
              >
                Criar Conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filteredConcursos = getFilteredConcursos()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-gray-900">
                Concurso Público
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              {/* Navegação centralizada */}
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Procedimentos
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href="/favoritos"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Favoritos ({activeFavoritedCount})
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Cabeçalho */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Meus Favoritos</h1>
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('ativos')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'ativos'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Ativos ({concursos.filter(c => {
                  if (!c.prazo_propostas) return false
                  const prazoDate = new Date(c.prazo_propostas)
                  const hoje = new Date()
                  hoje.setHours(0, 0, 0, 0)
                  prazoDate.setHours(0, 0, 0, 0)
                  return prazoDate >= hoje
                }).length})
              </button>
              <button
                onClick={() => setActiveTab('expirados')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'expirados'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Expirados ({concursos.filter(c => {
                  if (!c.prazo_propostas) return false
                  const prazoDate = new Date(c.prazo_propostas)
                  const hoje = new Date()
                  hoje.setHours(0, 0, 0, 0)
                  prazoDate.setHours(0, 0, 0, 0)
                  return prazoDate < hoje
                }).length})
              </button>
            </div>
          </div>

          {/* Lista de Concursos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Concursos {activeTab === 'ativos' ? 'Ativos' : 'Expirados'}
            </h3>
            
            {isLoadingConcursos ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando favoritos...</span>
              </div>
            ) : filteredConcursos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {activeTab === 'ativos' 
                  ? 'Nenhum concurso ativo nos seus favoritos.' 
                  : 'Nenhum concurso expirado nos seus favoritos.'
                }
              </p>
            ) : (
              <div className="space-y-4">
                {filteredConcursos.map((concurso) => (
                  <div key={concurso.id} className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 relative ${
                    expandedConcursos.has(concurso.id) 
                      ? 'border-green-400 shadow-lg shadow-green-100 bg-green-50/30' 
                      : 'border-gray-200'
                  }`}>
                    {/* Ícone de estrela no canto superior direito */}
                    <button
                      onClick={() => toggleFavorite(concurso.id)}
                      className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                      title={favoritedConcursos.has(concurso.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                      <svg 
                        className={`w-5 h-5 transition-colors ${
                          favoritedConcursos.has(concurso.id) 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-400 hover:text-yellow-500'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                        />
                      </svg>
                    </button>

                    <div className="flex justify-between items-start mb-2 pr-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {concurso.n_procedimento}
                          </span>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {concurso.titulo && concurso.titulo.length > 70 
                              ? `${concurso.titulo.substring(0, 70)}...` 
                              : concurso.titulo
                            }
                          </h4>
                        </div>
                      </div>
                      {concurso.urgente && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          Urgente
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Entidade:</span> {concurso.entidade}
                      </div>
                      <div>
                        <span className="font-medium">Data de Publicação:</span> {new Date(concurso.data_envio).toLocaleDateString('pt-PT')}
                      </div>
                      <div>
                        <span className="font-medium">Prazo de Propostas:</span> {concurso.prazo_propostas ? new Date(concurso.prazo_propostas).toLocaleDateString('pt-PT') : 'Não especificado'}
                      </div>
                      <div>
                        <span className="font-medium">Preço Base:</span> {concurso.preco_base ? `€${concurso.preco_base}` : 'Não especificado'}
                        {concurso.prazo_execucao && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {concurso.prazo_execucao}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Tempo restante até o prazo */}
                    {concurso.prazo_propostas && (
                      <div className="mt-3">
                        {(() => {
                          const timeRemaining = calculateTimeRemaining(concurso.prazo_propostas)
                          return timeRemaining ? (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${timeRemaining.color}`}>
                              {timeRemaining.text}
                            </span>
                          ) : null
                        })()}
                      </div>
                    )}
                    
                    {/* Botão Mais detalhes */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={() => toggleExpansion(concurso.id)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        <span>{expandedConcursos.has(concurso.id) ? 'Menos detalhes' : 'Mais detalhes'}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform ${expandedConcursos.has(concurso.id) ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Seção expandida com todos os detalhes */}
                    {expandedConcursos.has(concurso.id) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Detalhes Completos</h5>
                        <div className="space-y-3 text-sm">
                          {/* Informações básicas */}
                          <div>
                            <span className="font-medium text-gray-600">Título:</span> {concurso.titulo}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Entidade:</span> {concurso.entidade}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Distrito:</span> {concurso.distrito || 'Não especificado'}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Concelho:</span> {concurso.concelho || 'Não especificado'}
                          </div>
                          
                          {/* Separador */}
                          <div className="border-t border-gray-300 my-3"></div>
                          
                          {/* Critério de Adjudicação */}
                          <div>
                            <span className="font-medium text-gray-600">Critério de Adjudicação:</span>
                            <div className="mt-1 pl-4">
                              {concurso.monofator ? (
                                <div className="text-gray-700">{concurso.monofator}</div>
                              ) : concurso.multifator ? (
                                <div className="text-gray-700 whitespace-pre-line">{concurso.multifator.replace(/\|/g, '\n')}</div>
                              ) : (
                                <div className="text-gray-500 italic">Não especificado</div>
                              )}
                            </div>
                          </div>
                          
                          {/* Separador */}
                          <div className="border-t border-gray-300 my-3"></div>
                          
                          {/* Plataforma */}
                          {concurso.url_apresentacao && (
                            <div>
                              <span className="font-medium text-gray-600">Plataforma:</span>{' '}
                              <a 
                                href={concurso.url_apresentacao} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {concurso.plataforma || concurso.url_apresentacao}
                              </a>
                            </div>
                          )}
                          
                          {/* Fonte PDF */}
                          {concurso.fonte_pdf && (
                            <div>
                              <span className="font-medium text-gray-600">Fonte PDF:</span>{' '}
                              <a 
                                href={concurso.fonte_pdf} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                DRE
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
