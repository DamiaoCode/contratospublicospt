'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
// @ts-ignore - moment types will be available after installation
import moment from 'moment'
import 'moment/locale/pt'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/Topbar'

moment.locale('pt')

interface Concurso {
  id: string
  n_procedimento: string
  titulo: string
  entidade: string
  data_envio: string
  prazo_propostas: string
  preco_base: number
  prazo_execucao?: string
  urgente: boolean
  distrito?: string
  concelho?: string
  monofator?: string
  multifator?: string
  url_apresentacao?: string
  plataforma?: string
  fonte_pdf?: string
}

interface TimelineBar {
  concurso: Concurso
  startDate: moment.Moment
  endDate: moment.Moment
  daysRemaining: number | null
  className: string
}

export default function Calendario() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [favoritedConcursos, setFavoritedConcursos] = useState<Set<string>>(new Set())
  const [concursos, setConcursos] = useState<Concurso[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFavoritedCount, setActiveFavoritedCount] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(moment().month())
  const [currentYear, setCurrentYear] = useState(moment().year())
  const [selectedConcurso, setSelectedConcurso] = useState<Concurso | null>(null)
  const [showModal, setShowModal] = useState(false)

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
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('Concursos')
        .select('*')
        .in('id', Array.from(favoritedConcursos))
        .order('prazo_propostas', { ascending: true })

      if (error) {
        console.error('Erro ao buscar concursos favoritados:', error)
        return
      }

      setConcursos(data || [])
    } catch (err) {
      console.error('Erro ao buscar concursos favoritados:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar estado de autenticação
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session)
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
      setIsLoading(false)
    }
  }, [isLoggedIn])

  // Buscar concursos quando favoritos mudarem
  useEffect(() => {
    if (isLoggedIn && favoritedConcursos.size > 0) {
      fetchFavoritedConcursos()
    } else if (isLoggedIn) {
      setIsLoading(false)
    }
  }, [favoritedConcursos, isLoggedIn])

  // Calcular favoritos ativos
  useEffect(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const activeCount = concursos.filter(concurso => {
      if (!favoritedConcursos.has(concurso.id)) return false
      if (!concurso.prazo_propostas) return false
      
      const prazoDate = new Date(concurso.prazo_propostas)
      prazoDate.setHours(0, 0, 0, 0)
      
      return prazoDate >= hoje
    }).length

    setActiveFavoritedCount(activeCount)
  }, [concursos, favoritedConcursos])

  // Função para calcular dias restantes
  const getDaysRemaining = (prazoPropostas: string) => {
    if (!prazoPropostas) return null
    
    const prazoDate = new Date(prazoPropostas)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    prazoDate.setHours(0, 0, 0, 0)
    
    const diffTime = prazoDate.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays >= 0 ? diffDays : null
  }

  // Função para calcular tempo restante (similar ao ContestCard)
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

  // Função para abrir modal com detalhes do concurso
  const handleConcursoClick = (concurso: Concurso) => {
    setSelectedConcurso(concurso)
    setShowModal(true)
  }

  // Função para fechar modal
  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedConcurso(null)
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

      // Se o concurso foi removido dos favoritos, remover da lista também
      if (isCurrentlyFavorited) {
        setConcursos(prev => prev.filter(c => c.id !== concursoId))
      }

    } catch (err) {
      console.error('Erro inesperado ao favoritar:', err)
      alert('Erro inesperado. Tente novamente.')
    }
  }

  // Calcular barras da timeline para o mês atual
  const timelineBars = useMemo(() => {
    const hoje = moment()
    const monthStart = moment().month(currentMonth).year(currentYear).startOf('month')
    const monthEnd = moment().month(currentMonth).year(currentYear).endOf('month')
    const bars: TimelineBar[] = []

    concursos.forEach((concurso) => {
      if (!concurso.prazo_propostas || !concurso.data_envio) return

      const startTime = moment(concurso.data_envio).startOf('day')
      const endTime = moment(concurso.prazo_propostas).endOf('day')
      
      // Verificar se o período se sobrepõe com o mês atual
      const periodStart = startTime.isBefore(monthStart) ? monthStart : startTime
      const periodEnd = endTime.isAfter(monthEnd) ? monthEnd : endTime
      
      if (periodStart.isSameOrBefore(periodEnd)) {
        const daysRemaining = getDaysRemaining(concurso.prazo_propostas)
        
      // Determinar cor baseado nos dias restantes até o prazo
      let className = 'bg-green-200' // Verde claro por padrão (mais de 5 dias)
      
      if (endTime.isBefore(hoje)) {
        // Já expirado
        className = 'bg-red-300'
      } else {
        const daysRemaining = getDaysRemaining(concurso.prazo_propostas)
        
        if (daysRemaining !== null) {
          if (daysRemaining === 0) {
            // Termina hoje
            className = 'bg-red-300'
          } else if (daysRemaining >= 1 && daysRemaining <= 5) {
            // Entre 1 e 5 dias
            className = 'bg-orange-300'
          } else {
            // Mais de 5 dias
            className = 'bg-green-200'
          }
        }
      }

        bars.push({
          concurso,
          startDate: periodStart,
          endDate: periodEnd,
          daysRemaining,
          className
        })
      }
    })

    return bars.sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf())
  }, [concursos, currentMonth, currentYear])

  // Calcular dias do mês
  const monthDays = useMemo(() => {
    const days: moment.Moment[] = []
    const monthStart = moment().month(currentMonth).year(currentYear).startOf('month')
    const daysInMonth = monthStart.daysInMonth()
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(moment().month(currentMonth).year(currentYear).date(i))
    }
    
    return days
  }, [currentMonth, currentYear])

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Ir para hoje
  const goToToday = () => {
    const today = moment()
    setCurrentMonth(today.month())
    setCurrentYear(today.year())
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Calendário
            </h1>
            <p className="text-gray-600 mb-8">
              Faça login para ver seus concursos favoritos no calendário
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
      <Topbar activeFavoritedCount={activeFavoritedCount} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Cabeçalho */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Calendário de Favoritos</h1>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Hoje
              </button>
            </div>

            {/* Navegação do calendário */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {moment().month(currentMonth).year(currentYear).format('MMMM YYYY')}
              </h2>
              
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Timeline */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando calendário...</span>
              </div>
            ) : timelineBars.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhum concurso favorito para exibir no calendário.
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="relative" style={{ minHeight: '400px', padding: '20px' }}>
                  {(() => {
                    const monthStart = moment().month(currentMonth).year(currentYear).startOf('month')
                    const daysInMonth = monthStart.daysInMonth()
                    const hoje = moment()
                    
                    return (
                      <>
                        {/* Cabeçalho com dias do mês como colunas */}
                        <div className="relative border-b-2 border-gray-300 mb-2" style={{ minHeight: '40px' }}>
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1
                            const dayMoment = moment().month(currentMonth).year(currentYear).date(day)
                            const isToday = dayMoment.isSame(hoje, 'day')
                            const dayOfWeek = dayMoment.format('ddd') // Abreviação do dia da semana
                            const dayWidth = 100 / daysInMonth
                            
                            return (
                              <div
                                key={day}
                                className={`absolute border-r border-gray-200 last:border-r-0 text-center ${
                                  isToday ? 'bg-blue-100 border-blue-400' : ''
                                }`}
                                style={{ 
                                  left: `${(day - 1) * dayWidth}%`,
                                  width: `${dayWidth}%`,
                                  height: '100%'
                                }}
                              >
                                <div className={`text-xs font-semibold ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                                  {dayOfWeek}
                                </div>
                                <div className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-gray-900'}`}>
                                  {day}
                                  
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Timeline com barras */}
                        <div className="relative" style={{ minHeight: `${Math.max(300, timelineBars.length * 40)}px` }}>
                          {/* Linhas de grade verticais para cada dia */}
                          <div className="absolute inset-0">
                            {Array.from({ length: daysInMonth }, (_, i) => {
                              const dayWidth = 100 / daysInMonth
                              return (
                                <div
                                  key={i}
                                  className="absolute border-r border-gray-200 last:border-r-0"
                                  style={{ 
                                    left: `${i * dayWidth}%`,
                                    width: `${dayWidth}%`,
                                    height: '100%'
                                  }}
                                />
                              )
                            })}
                          </div>
                          
                          {/* Barras da timeline */}
                          {timelineBars.map((bar, barIndex) => {
                            const startDay = bar.startDate.date()
                            const endDay = bar.endDate.date()
                            
                            // Calcular posição e largura baseada nos dias
                            // Cada dia ocupa 100% / número de dias do mês
                            const dayWidth = 100 / daysInMonth // largura de cada dia em porcentagem
                            
                            // left: posição do início (dia 1 = 0%, dia 2 = dayWidth%, etc.)
                            // startDay - 1 porque o primeiro dia (1) deve estar em 0%
                            const left = (startDay - 1) * dayWidth
                            
                            // width: número de dias que a barra ocupa
                            // endDay - startDay + 1 porque inclui ambos os dias (início e fim)
                            const numDays = endDay - startDay + 1
                            const width = numDays * dayWidth
                            
                            const isStart = bar.startDate.isSame(moment(bar.concurso.data_envio), 'day')
                            const isEnd = bar.endDate.isSame(moment(bar.concurso.prazo_propostas), 'day')
                            const hojeInPeriod = hoje.isSameOrAfter(bar.startDate) && hoje.isSameOrBefore(bar.endDate)
                            
                              return (
                                <div
                                  key={bar.concurso.id}
                                  className="absolute pointer-events-auto cursor-pointer"
                                  style={{
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    top: `${barIndex * 40}px`,
                                    height: '32px',
                                    zIndex: 10
                                  }}
                                  title={`${bar.concurso.titulo} - ${bar.concurso.entidade} | Publicado: ${bar.concurso.data_envio} | Prazo: ${bar.concurso.prazo_propostas}`}
                                  onClick={() => handleConcursoClick(bar.concurso)}
                                >
                                <div
                                  className={`h-full text-xs font-medium px-2 flex items-center truncate ${
                                    bar.className
                                  } ${
                                    bar.className.includes('red') 
                                      ? 'text-red-900' 
                                      : bar.className.includes('orange')
                                      ? 'text-orange-900'
                                      : 'text-green-900'
                                  }`}
                                  style={{
                                    borderRadius: isStart && isEnd 
                                      ? '6px' 
                                      : isStart 
                                      ? '6px 0 0 6px' 
                                      : isEnd 
                                      ? '0 6px 6px 0'
                                      : '0',
                                    borderLeft: isStart ? '3px solid #1e40af' : 'none',
                                    borderRight: isEnd ? '3px solid #dc2626' : 'none',
                                    borderTop: hojeInPeriod && !isStart && !isEnd ? '2px solid #1e40af' : 'none',
                                    borderBottom: hojeInPeriod && !isStart && !isEnd ? '2px solid #1e40af' : 'none'
                                  }}
                                >
                                  {isStart && '📢 '}
                                  {isEnd && '📅 '}
                                  {hojeInPeriod && !isStart && !isEnd && '📍 '}
                                  {bar.concurso.n_procedimento}
                                  {bar.daysRemaining !== null && bar.daysRemaining <= 7 && (
                                    <span className="ml-1 font-bold">({bar.daysRemaining}d)</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* Legenda */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Legenda:</h3>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 rounded"></div>
                  <span>Mais de 5 dias restantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-300 rounded"></div>
                  <span>Entre 1 e 5 dias restantes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-300 rounded"></div>
                  <span>Expira hoje ou já expirado</span>
                </div>
              </div>
            </div>

            {/* Lista de concursos ativos */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Concursos Ativos</h3>
              {concursos.filter(c => {
                if (!c.prazo_propostas) return false
                const prazoDate = new Date(c.prazo_propostas)
                const hoje = new Date()
                hoje.setHours(0, 0, 0, 0)
                prazoDate.setHours(0, 0, 0, 0)
                return prazoDate >= hoje
              }).length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Nenhum concurso ativo nos seus favoritos.
                </p>
              ) : (
                <div className="space-y-2">
                  {concursos
                    .filter(c => {
                      if (!c.prazo_propostas) return false
                      const prazoDate = new Date(c.prazo_propostas)
                      const hoje = new Date()
                      hoje.setHours(0, 0, 0, 0)
                      prazoDate.setHours(0, 0, 0, 0)
                      return prazoDate >= hoje
                    })
                    .map((concurso) => {
                      const daysRemaining = getDaysRemaining(concurso.prazo_propostas)
                      return (
                        <div
                          key={concurso.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1 cursor-pointer" onClick={() => handleConcursoClick(concurso)}>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {concurso.n_procedimento}
                              </span>
                              <span className="text-sm font-medium text-gray-900 truncate" style={{ maxWidth: '400px' }}>
                                {concurso.titulo && concurso.titulo.length > 60 
                                  ? `${concurso.titulo.substring(0, 60)}...` 
                                  : concurso.titulo
                                }
                              </span>
                              {concurso.urgente && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                                  Urgente
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {concurso.entidade}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(concurso.prazo_propostas).toLocaleDateString('pt-PT')}
                              </div>
                              {daysRemaining !== null && (
                                <div className={`text-xs ${
                                  daysRemaining <= 7 ? 'text-red-600' : daysRemaining <= 30 ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                  {daysRemaining === 0 ? 'Expira hoje' : daysRemaining === 1 ? 'Expira amanhã' : `Faltam ${daysRemaining} dias`}
                                </div>
                              )}
                            </div>
                            {/* Botão de favorito */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(concurso.id)
                              }}
                              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
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
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Detalhes do Concurso */}
      {showModal && selectedConcurso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start">
              <h2 className="text-2xl font-bold text-gray-900">Detalhes do Concurso</h2>
              <div className="flex items-center gap-3">
                {/* Botão de favorito */}
                <button
                  onClick={() => toggleFavorite(selectedConcurso.id)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title={favoritedConcursos.has(selectedConcurso.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <svg 
                    className={`w-6 h-6 transition-colors ${
                      favoritedConcursos.has(selectedConcurso.id)
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
                {/* Botão de fechar */}
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {selectedConcurso.n_procedimento}
                  </span>
                  {selectedConcurso.urgente && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Urgente
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedConcurso.titulo}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Entidade:</span> {selectedConcurso.entidade}
                </div>
                <div>
                  <span className="font-medium">Data de Publicação:</span> {new Date(selectedConcurso.data_envio).toLocaleDateString('pt-PT')}
                </div>
                <div>
                  <span className="font-medium">Prazo de Propostas:</span> {selectedConcurso.prazo_propostas ? new Date(selectedConcurso.prazo_propostas).toLocaleDateString('pt-PT') : 'Não especificado'}
                </div>
                <div>
                  <span className="font-medium">Preço Base:</span> {selectedConcurso.preco_base ? `€${selectedConcurso.preco_base}` : 'Não especificado'}
                  {selectedConcurso.prazo_execucao && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedConcurso.prazo_execucao}
                    </span>
                  )}
                </div>
              </div>

              {/* Tempo restante até o prazo */}
              {selectedConcurso.prazo_propostas && (
                <div className="mb-4">
                  {(() => {
                    const timeRemaining = calculateTimeRemaining(selectedConcurso.prazo_propostas)
                    return timeRemaining ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${timeRemaining.color}`}>
                        {timeRemaining.text}
                      </span>
                    ) : null
                  })()}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Informações Adicionais</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Distrito:</span> {selectedConcurso.distrito || 'Não especificado'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Concelho:</span> {selectedConcurso.concelho || 'Não especificado'}
                  </div>
                  
                  {/* Critério de Adjudicação */}
                  <div>
                    <span className="font-medium text-gray-600">Critério de Adjudicação:</span>
                    <div className="mt-1 pl-4">
                      {selectedConcurso.monofator ? (
                        <div className="text-gray-700">{selectedConcurso.monofator}</div>
                      ) : selectedConcurso.multifator ? (
                        <div className="text-gray-700 whitespace-pre-line">{selectedConcurso.multifator.replace(/\|/g, '\n')}</div>
                      ) : (
                        <div className="text-gray-500 italic">Não especificado</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Plataforma */}
                  {selectedConcurso.url_apresentacao && (
                    <div>
                      <span className="font-medium text-gray-600">Plataforma:</span>{' '}
                      <a 
                        href={selectedConcurso.url_apresentacao} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {selectedConcurso.plataforma || 'Acessar Plataforma'}
                      </a>
                    </div>
                  )}
                  
                  {/* Fonte PDF */}
                  {selectedConcurso.fonte_pdf && (
                    <div>
                      <span className="font-medium text-gray-600">Fonte PDF:</span>{' '}
                      <a 
                        href={selectedConcurso.fonte_pdf} 
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
