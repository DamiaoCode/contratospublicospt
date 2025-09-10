'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/Topbar'
import ContestCard from '@/components/ContestCard'

export default function EntidadePage() {
  const params = useParams()
  const nipc = params.nipc as string
  
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [favoritedConcursos, setFavoritedConcursos] = useState<Set<string>>(new Set())
  const [activeFavoritedCount, setActiveFavoritedCount] = useState(0)
  const [entidade, setEntidade] = useState<any>(null)
  const [concursos, setConcursos] = useState<any[]>([])
  const [isLoadingConcursos, setIsLoadingConcursos] = useState(false)
  const [activeTab, setActiveTab] = useState<'ativos' | 'expirados'>('ativos')
  const [expandedConcursos, setExpandedConcursos] = useState<Set<string>>(new Set())

  // Buscar dados da entidade
  const fetchEntidade = async () => {
    try {
      const { data, error } = await supabase
        .from('Entidades')
        .select('entidade, nipc')
        .eq('nipc', nipc)
        .single()

      if (error) {
        console.error('Erro ao buscar entidade:', error)
        return
      }

      setEntidade(data)
    } catch (err) {
      console.error('Erro ao buscar entidade:', err)
    }
  }

  // Buscar concursos da entidade
  const fetchConcursosEntidade = async () => {
    setIsLoadingConcursos(true)
    try {
      const { data, error } = await supabase
        .from('Concursos')
        .select('*')
        .eq('nipc', nipc)
        .order('data_envio', { ascending: false })

      if (error) {
        console.error('Erro ao buscar concursos da entidade:', error)
        return
      }

      setConcursos(data || [])
    } catch (err) {
      console.error('Erro ao buscar concursos da entidade:', err)
    } finally {
      setIsLoadingConcursos(false)
    }
  }

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

  // Função para alternar favorito
  const toggleFavorite = async (concursoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Usuário não autenticado')
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

  // Carregar dados quando o componente monta
  useEffect(() => {
    if (nipc) {
      fetchEntidade()
      fetchConcursosEntidade()
    }
  }, [nipc])

  // Carregar favoritos quando logado
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserFavorites()
    } else {
      setFavoritedConcursos(new Set())
    }
  }, [isLoggedIn])

  // Atualizar contador de favoritos ativos
  useEffect(() => {
    const activeCount = calculateActiveFavoritedCount()
    setActiveFavoritedCount(activeCount)
  }, [concursos, favoritedConcursos])

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
              Procedimentos da Entidade
            </h1>
            <p className="text-gray-600 mb-8">
              Faça login para ver os procedimentos desta entidade
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
      <Topbar activeFavoritedCount={activeFavoritedCount} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Cabeçalho */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Procedimentos de {entidade?.entidade || 'Carregando...'}
            </h1>
            
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
                <span className="ml-2 text-gray-600">Carregando procedimentos...</span>
              </div>
            ) : filteredConcursos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {activeTab === 'ativos' 
                  ? 'Nenhum procedimento ativo para esta entidade.' 
                  : 'Nenhum procedimento expirado para esta entidade.'
                }
              </p>
            ) : (
              <div className="space-y-4">
                {filteredConcursos.map((concurso) => (
                  <ContestCard
                    key={concurso.id}
                    concurso={concurso}
                    isFavorited={favoritedConcursos.has(concurso.id)}
                    isExpanded={expandedConcursos.has(concurso.id)}
                    onToggleFavorite={toggleFavorite}
                    onToggleExpansion={toggleExpansion}
                    calculateTimeRemaining={calculateTimeRemaining}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
