'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Notification from '@/app/components/Notification'

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [favoritedConcursos, setFavoritedConcursos] = useState<Set<string>>(new Set())
  const [activeFavoritedCount, setActiveFavoritedCount] = useState(0)
  const [entidades, setEntidades] = useState<any[]>([])
  const [selectedEntidade, setSelectedEntidade] = useState('')
  const [showNipcInput, setShowNipcInput] = useState(false)
  const [nipcInput, setNipcInput] = useState('')
  const [isLoadingEntidades, setIsLoadingEntidades] = useState(false)
  const [isSearchingNipc, setIsSearchingNipc] = useState(false)
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false
  })
  const [entidadesSeguidas, setEntidadesSeguidas] = useState<any[]>([])
  const [isLoadingEntidadesSeguidas, setIsLoadingEntidadesSeguidas] = useState(false)
  const [showEntidadeMenu, setShowEntidadeMenu] = useState<string | null>(null)

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

  // Função para calcular favoritos ativos
  const calculateActiveFavoritedCount = async () => {
    try {
      const { data: concursos, error } = await supabase
        .from('Concursos')
        .select('id, prazo_propostas')
        .in('id', Array.from(favoritedConcursos))

      if (error) {
        console.error('Erro ao buscar concursos para contagem:', error)
        return
      }

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const activeCount = concursos?.filter(concurso => {
        if (!concurso.prazo_propostas) return false
        
        const prazoDate = new Date(concurso.prazo_propostas)
        prazoDate.setHours(0, 0, 0, 0)
        
        return prazoDate >= hoje
      }).length || 0

      setActiveFavoritedCount(activeCount)
    } catch (err) {
      console.error('Erro ao calcular favoritos ativos:', err)
    }
  }

  // Função para mostrar notificações
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({
      message,
      type,
      isVisible: true
    })
  }

  // Deixar de seguir uma entidade
  const handleUnfollowEntidade = async (nipc: string, nomeEntidade: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showNotification('Você precisa estar logado para gerenciar entidades.', 'error')
        return
      }

      // Buscar configurações atuais do usuário
      const { data: userSettings, error: fetchError } = await supabase
        .from('Users_Settings')
        .select('entidades')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações do usuário:', fetchError)
        showNotification('Erro ao buscar configurações. Tente novamente.', 'error')
        return
      }

      let currentEntidades = userSettings?.entidades || []
      
      // Remover entidade do array
      currentEntidades = currentEntidades.filter((nipcAtual: string) => nipcAtual !== nipc)

      // Salvar no banco
      const { error: upsertError } = await supabase
        .from('Users_Settings')
        .upsert({
          user_id: user.id,
          entidades: currentEntidades
        })

      if (upsertError) {
        console.error('Erro ao salvar configurações:', upsertError)
        showNotification('Erro ao salvar alterações. Tente novamente.', 'error')
        return
      }

      showNotification(`Deixou de seguir ${nomeEntidade}`, 'success')
      
      // Recarregar lista de entidades seguidas
      fetchEntidadesSeguidas()
      
      // Fechar menu
      setShowEntidadeMenu(null)

    } catch (err) {
      console.error('Erro inesperado ao deixar de seguir entidade:', err)
      showNotification('Erro inesperado. Tente novamente.', 'error')
    }
  }

  // Buscar entidades
  const fetchEntidades = async () => {
    setIsLoadingEntidades(true)
    try {
      const { data, error } = await supabase
        .from('Entidades')
        .select('entidade, nipc')
        .order('entidade')

      if (error) {
        console.error('Erro ao buscar entidades:', error)
        return
      }

      setEntidades(data || [])
    } catch (err) {
      console.error('Erro ao buscar entidades:', err)
    } finally {
      setIsLoadingEntidades(false)
    }
  }

  // Buscar entidades seguidas pelo usuário
  const fetchEntidadesSeguidas = async () => {
    setIsLoadingEntidadesSeguidas(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setEntidadesSeguidas([])
        return
      }

      // Buscar entidades seguidas pelo usuário
      const { data: userSettings, error: userError } = await supabase
        .from('Users_Settings')
        .select('entidades')
        .eq('user_id', user.id)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        console.error('Erro ao buscar entidades seguidas:', userError)
        setEntidadesSeguidas([])
        return
      }

      const nipcsSeguidas = userSettings?.entidades || []
      
      if (nipcsSeguidas.length === 0) {
        setEntidadesSeguidas([])
        return
      }

      // Buscar informações das entidades seguidas
      const { data: entidadesData, error: entidadesError } = await supabase
        .from('Entidades')
        .select('entidade, nipc')
        .in('nipc', nipcsSeguidas)

      if (entidadesError) {
        console.error('Erro ao buscar dados das entidades:', entidadesError)
        setEntidadesSeguidas([])
        return
      }

      // Para cada entidade, contar procedimentos ativos
      const entidadesComContagem = await Promise.all(
        (entidadesData || []).map(async (entidade) => {
          const hoje = new Date()
          hoje.setHours(0, 0, 0, 0)

          const { data: concursos, error: concursosError } = await supabase
            .from('Concursos')
            .select('id, prazo_propostas')
            .eq('nipc', entidade.nipc)

          if (concursosError) {
            console.error('Erro ao buscar concursos da entidade:', concursosError)
            return {
              ...entidade,
              procedimentosAtivos: 0
            }
          }

          const procedimentosAtivos = concursos?.filter(concurso => {
            if (!concurso.prazo_propostas) return false
            
            const prazoDate = new Date(concurso.prazo_propostas)
            prazoDate.setHours(0, 0, 0, 0)
            
            return prazoDate >= hoje
          }).length || 0

          return {
            ...entidade,
            procedimentosAtivos
          }
        })
      )

      setEntidadesSeguidas(entidadesComContagem)

    } catch (err) {
      console.error('Erro ao buscar entidades seguidas:', err)
      setEntidadesSeguidas([])
    } finally {
      setIsLoadingEntidadesSeguidas(false)
    }
  }

  // Salvar entidade selecionada do dropdown
  const handleSaveEntidade = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showNotification('Você precisa estar logado para seguir entidades.', 'error')
        return
      }

      const entidade = entidades.find(e => e.entidade === selectedEntidade)
      if (!entidade) {
        showNotification('Por favor, selecione uma entidade.', 'error')
        return
      }

      const nipcToSave = entidade.nipc

      // Buscar configurações atuais do usuário
      const { data: userSettings, error: fetchError } = await supabase
        .from('Users_Settings')
        .select('entidades')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações do usuário:', fetchError)
        return
      }

      let currentEntidades = userSettings?.entidades || []
      
      // Verificar se já não está seguindo esta entidade
      if (currentEntidades.includes(nipcToSave)) {
        showNotification('Você já está seguindo esta entidade.', 'info')
        return
      }

      // Adicionar nova entidade
      currentEntidades.push(nipcToSave)

      // Salvar no banco
      const { error: upsertError } = await supabase
        .from('Users_Settings')
        .upsert({
          user_id: user.id,
          entidades: currentEntidades
        })

      if (upsertError) {
        console.error('Erro ao salvar entidade:', upsertError)
        showNotification('Erro ao salvar entidade. Tente novamente.', 'error')
        return
      }

      showNotification('Entidade adicionada com sucesso!', 'success')
      setSelectedEntidade('')
      
      // Recarregar lista de entidades seguidas
      fetchEntidadesSeguidas()

    } catch (err) {
      console.error('Erro inesperado ao salvar entidade:', err)
      showNotification('Erro inesperado. Tente novamente.', 'error')
    }
  }

  // Pesquisar NIPC na API do VIES
  const handleSearchNipc = async () => {
    if (!nipcInput.trim()) {
      showNotification('Por favor, digite um NIPC válido.', 'error')
      return
    }

    setIsSearchingNipc(true)
    try {
      // Usar API route interna para evitar problemas de CORS
      const response = await fetch(`/api/vies?nipc=${encodeURIComponent(nipcInput.trim())}`)
      
      if (!response.ok) {
        throw new Error('Erro na consulta à API do VIES')
      }

      const data = await response.json()
      
      if (!data.isValid) {
        showNotification('NIPC inválido ou não encontrado na base de dados do VIES.', 'error')
        return
      }

      // Adicionar entidade à tabela Entidades
      const { error: insertError } = await supabase
        .from('Entidades')
        .insert({
          nipc: nipcInput.trim(),
          entidade: data.name
        })

      if (insertError) {
        // Se já existe, continuar normalmente
        if (insertError.code !== '23505') {
          console.error('Erro ao adicionar entidade:', insertError)
          showNotification('Erro ao adicionar entidade à base de dados.', 'error')
          return
        }
      }

      // Adicionar às entidades seguidas pelo usuário
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showNotification('Você precisa estar logado para seguir entidades.', 'error')
        return
      }

      // Buscar configurações atuais do usuário
      const { data: userSettings, error: fetchError } = await supabase
        .from('Users_Settings')
        .select('entidades')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações do usuário:', fetchError)
        return
      }

      let currentEntidades = userSettings?.entidades || []
      
      // Verificar se já não está seguindo esta entidade
      if (currentEntidades.includes(nipcInput.trim())) {
        showNotification('Você já está seguindo esta entidade.', 'info')
        return
      }

      // Adicionar nova entidade
      currentEntidades.push(nipcInput.trim())

      // Salvar no banco
      const { error: upsertError } = await supabase
        .from('Users_Settings')
        .upsert({
          user_id: user.id,
          entidades: currentEntidades
        })

      if (upsertError) {
        console.error('Erro ao salvar entidade:', upsertError)
        showNotification('Erro ao salvar entidade. Tente novamente.', 'error')
        return
      }

      showNotification(`A entidade ${data.name} foi adicionada à listagem`, 'success')
      
      // Recarregar lista de entidades
      await fetchEntidades()
      
      // Recarregar lista de entidades seguidas
      fetchEntidadesSeguidas()
      
      // Voltar ao dropdown vazio
      setShowNipcInput(false)
      setNipcInput('')
      setSelectedEntidade('')

    } catch (err) {
      console.error('Erro ao pesquisar NIPC:', err)
      showNotification('Erro ao consultar o NIPC. Verifique se o número está correto e tente novamente.', 'error')
    } finally {
      setIsSearchingNipc(false)
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

  // Calcular favoritos ativos quando favoritos mudarem
  useEffect(() => {
    if (isLoggedIn && favoritedConcursos.size > 0) {
      calculateActiveFavoritedCount()
    } else {
      setActiveFavoritedCount(0)
    }
  }, [favoritedConcursos, isLoggedIn])

  // Carregar entidades quando logado
  useEffect(() => {
    if (isLoggedIn) {
      fetchEntidades()
      fetchEntidadesSeguidas()
    }
  }, [isLoggedIn])

  // Recarregar entidades seguidas quando favoritos mudarem
  useEffect(() => {
    if (isLoggedIn) {
      fetchEntidadesSeguidas()
    }
  }, [favoritedConcursos, isLoggedIn])

  // Fechar menu de entidade quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.entidade-menu-container')) {
        setShowEntidadeMenu(null)
      }
    }

    if (showEntidadeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEntidadeMenu])

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
              Dashboard
            </h1>
            <p className="text-gray-600 mb-8">
              Faça login para acessar o dashboard
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
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 px-4 py-2 rounded-md text-sm font-medium bg-blue-50 rounded-md transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
            <p className="text-gray-600">
              Bem-vindo ao dashboard do sistema de concursos públicos.
            </p>
          </div>

          {/* Conteúdo do Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Card de Estatísticas */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Favoritos Ativos:</span>
                  <span className="font-semibold text-blue-600">{activeFavoritedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total de Favoritos:</span>
                  <span className="font-semibold text-gray-900">{favoritedConcursos.size}</span>
                </div>
              </div>
            </div>

            {/* Card de Ações Rápidas */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Ver Procedimentos
                </Link>
                <Link
                  href="/favoritos"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Meus Favoritos
                </Link>
              </div>
            </div>
          </div>

          {/* Card de Seguir Entidades */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguir Entidades</h3>
            
            {!showNipcInput ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="entidade-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione uma entidade:
                  </label>
                  <select
                    id="entidade-select"
                    value={selectedEntidade}
                    onChange={(e) => setSelectedEntidade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoadingEntidades}
                  >
                    <option value="">{isLoadingEntidades ? 'Carregando...' : 'Selecione uma entidade'}</option>
                    {entidades.map((entidade, index) => (
                      <option key={index} value={entidade.entidade}>
                        {entidade.entidade}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveEntidade}
                    disabled={!selectedEntidade || isLoadingEntidades}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Guardar Entidade
                  </button>
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={() => setShowNipcInput(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    A entidade que pretendo seguir não aparece na listagem!
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="nipc-input" className="block text-sm font-medium text-gray-700 mb-2">
                    Digite o NIPC da entidade:
                  </label>
                  <input
                    id="nipc-input"
                    type="text"
                    value={nipcInput}
                    onChange={(e) => setNipcInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Digite apenas números"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSearchNipc}
                    disabled={!nipcInput.trim() || isSearchingNipc}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSearchingNipc ? 'Pesquisando...' : 'Pesquisar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowNipcInput(false)
                      setNipcInput('')
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Entidades Seguidas */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Entidades Seguidas</h3>
            
            {isLoadingEntidadesSeguidas ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando entidades...</span>
              </div>
            ) : entidadesSeguidas.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma entidade sendo seguida no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {entidadesSeguidas.map((entidade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border relative">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{entidade.entidade}</h4>
                      <p className="text-sm text-gray-500">NIPC: {entidade.nipc}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          entidade.procedimentosAtivos > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {entidade.procedimentosAtivos > 0 
                            ? `${entidade.procedimentosAtivos} Procedimento${entidade.procedimentosAtivos !== 1 ? 's' : ''} Ativo${entidade.procedimentosAtivos !== 1 ? 's' : ''}`
                            : 'Sem Procedimentos Ativos'
                          }
                        </span>
                      </div>
                      
                      {/* Ícone de link para entidades com procedimentos */}
                      {entidade.procedimentosAtivos > 0 && (
                        <Link
                          href={`/entidade/${entidade.nipc}`}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                          title="Ver procedimentos da entidade"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}
                      
                      {/* Menu de 3 pontos */}
                      <div className="entidade-menu-container relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowEntidadeMenu(showEntidadeMenu === entidade.nipc ? null : entidade.nipc)
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                        
                        {/* Dropdown menu */}
                        {showEntidadeMenu === entidade.nipc && (
                          <div className="absolute right-0 top-10 bg-white rounded-md shadow-lg border z-50 min-w-[160px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUnfollowEntidade(entidade.nipc, entidade.entidade)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Deixar de Seguir
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Componente de Notificação */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
}
