'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Topbar from '@/components/Topbar'
import ContestCard from '@/components/ContestCard'
import Notification from '@/app/components/Notification'

export default function Home() {
  const [showModal, setShowModal] = useState(false)
  const [userName, setUserName] = useState('')
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [filterToDelete, setFilterToDelete] = useState<any>(null)
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false
  })
  const [districts, setDistricts] = useState<string[]>([])
  const [municipalities, setMunicipalities] = useState<string[]>([])
  const [allMunicipalities, setAllMunicipalities] = useState<string[]>([])
  const [filterForm, setFilterForm] = useState({
    title: '',
    district: 'Todos',
    municipality: 'Todos'
  })
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [isSavingFilter, setIsSavingFilter] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [userFilters, setUserFilters] = useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null)
  const [editingFilter, setEditingFilter] = useState<any>(null)
  const [concursos, setConcursos] = useState<any[]>([])
  const [filteredConcursos, setFilteredConcursos] = useState<any[]>([])
  const [isLoadingConcursos, setIsLoadingConcursos] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [favoritedConcursos, setFavoritedConcursos] = useState<Set<string>>(new Set())
  const [expandedConcursos, setExpandedConcursos] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'ativos' | 'expirados'>('ativos')
  const [activeFavoritedCount, setActiveFavoritedCount] = useState(0)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionModalType, setSessionModalType] = useState<'favoritos' | 'dashboard'>('favoritos')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [sortBy, setSortBy] = useState('prazo_propostas_asc')

  // Opções de ordenação
  const sortOptions = [
    { value: 'prazo_propostas_asc', label: 'Prazo de Entrega de Propostas (Ascendente)' },
    { value: 'prazo_propostas_desc', label: 'Prazo de Entrega de Propostas (Descendente)' },
    { value: 'data_envio_asc', label: 'Data de Publicação (Ascendente)' },
    { value: 'data_envio_desc', label: 'Data de Publicação (Descendente)' },
    { value: 'n_procedimento_asc', label: 'Nº Publicação (Ascendente)' },
    { value: 'n_procedimento_desc', label: 'Nº Publicação (Descendente)' }
  ]

  // Função para aplicar ordenação
  const applySorting = (concursos: any[]) => {
    const lastUnderscoreIndex = sortBy.lastIndexOf('_')
    const field = sortBy.substring(0, lastUnderscoreIndex)
    const direction = sortBy.substring(lastUnderscoreIndex + 1)
    const isAscending = direction === 'asc'
    
    return [...concursos].sort((a, b) => {
      let valueA, valueB
      
      if (field === 'prazo_propostas') {
        valueA = new Date(a.prazo_propostas).getTime()
        valueB = new Date(b.prazo_propostas).getTime()
      } else if (field === 'data_envio') {
        valueA = new Date(a.data_envio).getTime()
        valueB = new Date(b.data_envio).getTime()
      } else if (field === 'n_procedimento') {
        valueA = parseInt(a.n_procedimento) || 0
        valueB = parseInt(b.n_procedimento) || 0
      } else {
        return 0
      }
      
      if (isAscending) {
        return valueA - valueB
      } else {
        return valueB - valueA
      }
    })
  }

  // Buscar distritos únicos da tabela de municípios
  const fetchDistricts = async () => { 
    try {
      const { data, error } = await supabase
        .from('Municipios')
        .select('distrito')
        .not('distrito', 'is', null)
      
      if (error) {
        console.error('Erro ao buscar distritos:', error)
        return
      }

      // Extrair distritos únicos
      const uniqueDistricts = Array.from(new Set(data?.map(item => item.distrito) || []))
      setDistricts(uniqueDistricts.sort())
    } catch (err) {
      console.error('Erro ao buscar distritos:', err)
    }
  }

  // Buscar todos os municípios
  const fetchAllMunicipalities = async () => {
    try {
      const { data, error } = await supabase
        .from('Municipios')
        .select('municipio')
        .not('municipio', 'is', null)
      
      if (error) {
        console.error('Erro ao buscar municípios:', error)
        return
      }

      // Extrair municípios únicos
      const uniqueMunicipalities = Array.from(new Set(data?.map(item => item.municipio) || []))
      setAllMunicipalities(uniqueMunicipalities.sort())
      setMunicipalities(uniqueMunicipalities.sort())
    } catch (err) {
      console.error('Erro ao buscar municípios:', err)
    }
  }

  // Filtrar municípios por distrito
  const fetchMunicipalitiesByDistrict = async (district: string) => {
    if (district === 'Todos') {
      setMunicipalities(allMunicipalities)
      return
    }

    try {
      const { data, error } = await supabase
        .from('Municipios')
        .select('municipio')
        .eq('distrito', district)
        .not('municipio', 'is', null)
      
      if (error) {
        console.error('Erro ao buscar municípios por distrito:', error)
        return
      }

      // Extrair municípios únicos
      const uniqueMunicipalities = Array.from(new Set(data?.map(item => item.municipio) || []))
      setMunicipalities(uniqueMunicipalities.sort())
    } catch (err) {
      console.error('Erro ao buscar municípios por distrito:', err)
    }
  }

  // Buscar filtros do usuário
  const fetchUserFilters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Usuário não autenticado')
        return
      }

      const { data, error } = await supabase
        .from('Concurso_Filtros')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar filtros:', error)
        return
      }

      setUserFilters(data || [])
    } catch (err) {
      console.error('Erro ao buscar filtros:', err)
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

  // Buscar concursos
  const fetchConcursos = async (query: string = '') => {
    setIsLoadingConcursos(true)
    try {
      let queryBuilder = supabase
        .from('Concursos')
        .select('*')
        .order('data_envio', { ascending: false })

      // Se há uma query de busca, aplicar filtro
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`titulo.ilike.%${query}%,entidade.ilike.%${query}%`)
      }

      const { data, error } = await queryBuilder

      if (error) {
        console.error('Erro ao buscar concursos:', error)
        return
      }

      const concursosData = data || []
      setConcursos(concursosData)
      setFilteredConcursos(concursosData)
    } catch (err) {
      console.error('Erro ao buscar concursos:', err)
    } finally {
      setIsLoadingConcursos(false)
    }
  }

  // Aplicar filtros aos concursos
  const applyFilters = (concursos: any[]) => {
    // Primeiro aplicar filtro por aba (ativos/expirados)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    let filteredByTab = concursos.filter(concurso => {
      if (!concurso.prazo_propostas) return false
      
      const prazoDate = new Date(concurso.prazo_propostas)
      prazoDate.setHours(0, 0, 0, 0)

      if (activeTab === 'ativos') {
        return prazoDate >= hoje
      } else {
        return prazoDate < hoje
      }
    })

    // Aplicar filtros personalizados se houver
    let finalFiltered = filteredByTab
    if (selectedFilters.length > 0) {
      const activeFilters = userFilters.filter(filter => selectedFilters.includes(filter.id))
      
      finalFiltered = filteredByTab.filter(concurso => {
        return activeFilters.some(filter => {
          // Verificar distrito
          if (filter.distrito && concurso.distrito !== filter.distrito) {
            return false
          }

          // Verificar concelhos (se o filtro tem concelhos específicos)
          if (filter.municipios && filter.municipios.length > 0) {
            if (!filter.municipios.includes(concurso.concelho)) {
              return false
            }
          }

          // Verificar palavras-chave (se o filtro tem palavras-chave)
          if (filter.keywords && filter.keywords.length > 0) {
            const concursoText = [
              concurso.titulo,
              concurso.entidade,
              concurso.descricao || '',
              concurso.objeto || '',
              concurso.criterios || ''
            ].join(' ').toLowerCase()

            const hasKeyword = filter.keywords.some((keyword: string) => 
              concursoText.includes(keyword.toLowerCase())
            )

            if (!hasKeyword) {
              return false
            }
          }

          return true
        })
      })
    }

    // Aplicar ordenação selecionada
    return applySorting(finalFiltered)
  }

  // Verificar estado de autenticação do Supabase
  useEffect(() => {
    // Verificar sessão atual
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsLoggedIn(true)
        setIsGuest(false)
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.removeItem('isGuest')
        // Obter nome do usuário
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário'
        setUserName(name)
      } else {
        // Verificar se é convidado
        const guestStatus = localStorage.getItem('isGuest')
        if (guestStatus === 'true') {
          setIsGuest(true)
        }
      }
    }

    checkUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setIsLoggedIn(true)
          setIsGuest(false)
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.removeItem('isGuest')
          // Obter nome do usuário
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário'
          setUserName(name)
        } else {
          setIsLoggedIn(false)
          setUserName('')
          // Manter estado de convidado se existir
          const guestStatus = localStorage.getItem('isGuest')
          if (guestStatus === 'true') {
            setIsGuest(true)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])



  // Carregar concursos quando o componente monta
  useEffect(() => {
    fetchConcursos()
  }, [])

  // Aplicar filtros quando os filtros selecionados, aba ou ordenação mudarem
  useEffect(() => {
    if (concursos.length > 0) {
      const filtered = applyFilters(concursos)
      setFilteredConcursos(filtered)
    }
  }, [selectedFilters, concursos, activeTab, sortBy])

  // Atualizar contador de favoritos ativos
  useEffect(() => {
    const activeCount = calculateActiveFavoritedCount()
    setActiveFavoritedCount(activeCount)
  }, [concursos, favoritedConcursos])

  // Carregar favoritos quando o usuário fizer login
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserFavorites()
    } else {
      setFavoritedConcursos(new Set())
    }
  }, [isLoggedIn])

  // Simulação de login - aceita qualquer preenchimento
  const handleLogin = () => {
    setIsLoggedIn(true)
    setIsGuest(false)
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.removeItem('isGuest')
  }

  const handleGuestAccess = () => {
    setIsGuest(true)
    localStorage.setItem('isGuest', 'true')
  }

  const handleCreateFilter = () => {
    if (!isLoggedIn) {
      setShowModal(true)
    } else {
      setShowFilterModal(true)
      fetchDistricts()
      fetchAllMunicipalities()
    }
  }

  const handleFilterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingFilter(true)
    
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Usuário não autenticado')
        alert('Usuário não autenticado. Faça login novamente.')
        setIsSavingFilter(false)
        return
      }

      // Preparar dados
      const filterData = {
        nome: filterForm.title,
        distrito: filterForm.district === 'Todos' ? null : filterForm.district,
        municipios: selectedMunicipalities.length > 0 ? selectedMunicipalities : null,
        keywords: selectedKeywords.length > 0 ? selectedKeywords : null,
        user_id: user.id
      }

      let data, error

      if (editingFilter) {
        // Atualizar filtro existente
        const { data: updateData, error: updateError } = await supabase
          .from('Concurso_Filtros')
          .update(filterData)
          .eq('id', editingFilter.id)
          .select()

        data = updateData
        error = updateError
      } else {
        // Criar novo filtro
        const { data: insertData, error: insertError } = await supabase
        .from('Concurso_Filtros')
        .insert([filterData])
        .select()

        data = insertData
        error = insertError
      }

      if (error) {
        console.error('Erro ao salvar filtro:', error)
        alert('Erro ao salvar filtro. Tente novamente.')
        setIsSavingFilter(false)
        return
      }

      console.log('Filtro salvo com sucesso:', data)
      showNotification(
        editingFilter 
          ? `O filtro "${filterForm.title}" foi atualizado com sucesso!` 
          : `O filtro "${filterForm.title}" foi criado com sucesso!`,
        'success'
      )
      
      // Recarregar lista de filtros se estiver visível
      if (showFilters) {
        fetchUserFilters()
      }
      
      // Fechar modal e limpar estado
      handleCloseFilterModal()
      
    } catch (err) {
      console.error('Erro inesperado ao salvar filtro:', err)
      alert('Erro inesperado. Tente novamente.')
    } finally {
      setIsSavingFilter(false)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'district') {
      // Quando o distrito muda, filtrar municípios e resetar município selecionado
      fetchMunicipalitiesByDistrict(value)
      setFilterForm(prev => ({
        ...prev,
        [name]: value,
        municipality: 'Todos'
      }))
    } else {
      setFilterForm(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const addMunicipality = () => {
    if (filterForm.municipality !== 'Todos' && !selectedMunicipalities.includes(filterForm.municipality)) {
      setSelectedMunicipalities(prev => [...prev, filterForm.municipality])
    }
  }

  const removeMunicipality = (municipality: string) => {
    setSelectedMunicipalities(prev => prev.filter(m => m !== municipality))
  }

  const addKeyword = () => {
    const keyword = keywordInput.trim()
    if (keyword && !selectedKeywords.includes(keyword)) {
      setSelectedKeywords(prev => [...prev, keyword])
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setSelectedKeywords(prev => prev.filter(k => k !== keyword))
  }

  const handleKeywordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  const handleMunicipalityKeyPress = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addMunicipality()
    }
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
    if (!showFilters) {
      fetchUserFilters()
    }
  }

  const handleFilterSelection = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    )
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setIsGuest(false)
    setUserName('')
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('isGuest')
  }

  // Função para abrir modal de eliminação
  const handleDeleteFilter = (filter: any) => {
    setFilterToDelete(filter)
    setShowDeleteModal(true)
  }

  // Função para confirmar eliminação
  const confirmDeleteFilter = async () => {
    if (!filterToDelete) return

    try {
      const { error } = await supabase
        .from('Concurso_Filtros')
        .delete()
        .eq('id', filterToDelete.id)

      if (error) {
        console.error('Erro ao eliminar filtro:', error)
        alert('Erro ao eliminar filtro. Tente novamente.')
        return
      }

      // Atualizar lista de filtros
      setUserFilters(prev => prev.filter(filter => filter.id !== filterToDelete.id))
      setSelectedFilters(prev => prev.filter(id => id !== filterToDelete.id))
      
      // Fechar modal
      setShowDeleteModal(false)
      setFilterToDelete(null)
    } catch (err) {
      console.error('Erro inesperado ao eliminar filtro:', err)
      alert('Erro inesperado. Tente novamente.')
    }
  }

  // Função para cancelar eliminação
  const cancelDeleteFilter = () => {
    setShowDeleteModal(false)
    setFilterToDelete(null)
  }

  // Função para mostrar notificação
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({
      message,
      type,
      isVisible: true
    })
  }

  // Função para fechar notificação
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }))
  }

  // Função para editar filtro
  const handleEditFilter = (filter: any) => {
    setEditingFilter(filter)
    setFilterForm({
      title: filter.nome,
      district: filter.distrito || 'Todos',
      municipality: 'Todos'
    })
    setSelectedMunicipalities(filter.municipios || [])
    setSelectedKeywords(filter.keywords || [])
    setKeywordInput('')
    setShowFilterModal(true)
    fetchDistricts()
    fetchAllMunicipalities()
  }

  // Função para fechar modal e limpar estado de edição
  const handleCloseFilterModal = () => {
    setShowFilterModal(false)
    setEditingFilter(null)
    setFilterForm({ title: '', district: 'Todos', municipality: 'Todos' })
    setSelectedMunicipalities([])
    setSelectedKeywords([])
    setKeywordInput('')
  }

  // Função para lidar com a busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchConcursos(searchQuery)
  }

  // Função para lidar com mudanças no input de busca
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
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

  // Função para alternar favorito
  const toggleFavorite = async (concursoId: string) => {
    try {
      // Obter o usuário atual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('Usuário não autenticado')
        setSessionModalType('favoritos')
        setShowSessionModal(true)
        return
      }

      // Verificar se o concurso já está favoritado
      const isCurrentlyFavorited = favoritedConcursos.has(concursoId)
      
      // Buscar configurações atuais do usuário
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
        // Remover dos favoritos
        currentFavoritos = currentFavoritos.filter((id: string) => id !== concursoId)
      } else {
        // Adicionar aos favoritos
        if (!currentFavoritos.includes(concursoId)) {
          currentFavoritos.push(concursoId)
        }
      }

      // Atualizar ou inserir configurações do usuário
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

      // Atualizar estado local
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
        // Se o card já está expandido, fecha ele
        newSet.delete(concursoId)
      } else {
        // Se o card não está expandido, fecha todos os outros e abre apenas este
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

  if (!isLoggedIn && !isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Concurso Público
            </h1>
            <p className="text-gray-600 mb-8">
              Sistema de gestão de concursos públicos
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
        
        <div className="text-center mt-6">
          <button
            onClick={handleGuestAccess}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Continuar sem conta
          </button>
        </div>
      </div>
    </div>
  )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar 
        activeFavoritedCount={activeFavoritedCount}
        onSessionModalOpen={(type) => {
          setSessionModalType(type)
          setShowSessionModal(true)
        }}
      />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Painel de Filtro */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Procurar Concursos
            </h2>
            
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Digite o nome do concurso, órgão ou cargo..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <button 
                onClick={toggleFilters}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out flex items-center gap-2"
              >
                <span>Meus Filtros</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <button 
                onClick={handleCreateFilter}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-150 ease-in-out"
              >
                Criar Filtro
              </button>
            </form>

            {/* Lista de filtros do usuário - dentro do mesmo container */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Meus Filtros Personalizados
                </h3>
                
                {userFilters.length === 0 ? (
                  <div className="text-center py-4">
                    {!isLoggedIn ? (
                      <p className="text-gray-500">
                        Crie uma{' '}
                        <Link 
                          href="/signup" 
                          className="text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          conta
                        </Link>
                        {' '}para poder adicionar filtros personalizados
                      </p>
                    ) : (
                      <p className="text-gray-500">
                    Nenhum filtro personalizado encontrado. Crie seu primeiro filtro!
                  </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userFilters.map((filter) => (
                      <div key={filter.id} className="relative">
                        <div 
                          className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          onMouseEnter={() => setHoveredFilter(filter.id)}
                          onMouseLeave={() => setHoveredFilter(null)}
                        >
                        <input
                          type="checkbox"
                          id={`filter-${filter.id}`}
                          checked={selectedFilters.includes(filter.id)}
                          onChange={() => handleFilterSelection(filter.id)}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <label htmlFor={`filter-${filter.id}`} className="block text-sm font-medium text-gray-900 cursor-pointer">
                            {filter.nome}
                          </label>
                          <div className="mt-1 text-xs text-gray-500">
                            {filter.distrito && (
                              <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">
                                {filter.distrito}
                              </span>
                            )}
                            {filter.municipios && filter.municipios.length > 0 && (
                              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full mr-2">
                                {filter.municipios.length} município(s)
                              </span>
                            )}
                            {filter.keywords && filter.keywords.length > 0 && (
                              <span className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                {filter.keywords.length} palavra(s)-chave
                              </span>
                            )}
                          </div>
                        </div>
                          
                          {/* Ícones de ação */}
                          <div className="flex items-center space-x-1">
                            {/* Ícone de Editar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditFilter(filter)
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                              title="Editar filtro"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            
                            {/* Ícone de Eliminar */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFilter(filter)
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                              title="Eliminar filtro"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Tooltip com detalhes */}
                        {hoveredFilter === filter.id && (
                          <div className="absolute z-10 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-1 left-0 top-full">
                            <h4 className="font-medium text-gray-900 mb-3">{filter.nome}</h4>
                            <div className="space-y-2">
                              {filter.distrito && (
                                <div>
                                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Distrito:</span>
                                  <p className="text-sm text-gray-800">{filter.distrito}</p>
                                </div>
                              )}
                              {filter.municipios && filter.municipios.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Municípios ({filter.municipios.length}):</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {filter.municipios.map((municipio: string, index: number) => (
                                      <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                        {municipio}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {filter.keywords && filter.keywords.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Palavras-chave ({filter.keywords.length}):</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {filter.keywords.map((keyword: string, index: number) => (
                                      <span key={index} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
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
            )}
          </div>

          {/* Lista de Concursos */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
              <h3 className="text-lg font-medium text-gray-900">
                Concursos Públicos
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Dropdown de Ordenação */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
                    Ordenar por:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('ativos')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'expirados'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Expirados
                </button>
                </div>
              </div>
            </div>
            
            {isLoadingConcursos ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando concursos...</span>
              </div>
            ) : filteredConcursos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                {searchQuery 
                  ? 'Nenhum concurso encontrado para a sua pesquisa.' 
                  : selectedFilters.length > 0 
                    ? `Nenhum concurso ${activeTab === 'ativos' ? 'ativo' : 'expirado'} encontrado com os filtros selecionados.`
                    : `Nenhum concurso ${activeTab === 'ativos' ? 'ativo' : 'expirado'} disponível no momento.`
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

      {/* Modal de Sessão Necessária */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Sessão Necessária
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  {isGuest 
                    ? 'Está a navegar como convidado. Crie uma conta para ter acesso a filtros personalizados.'
                    : 'Você precisa fazer login para aceder à funcionalidade de criar filtros personalizados.'
                  }
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-primary-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition duration-150 ease-in-out"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar Filtro */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[9999]">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingFilter ? 'Editar Filtro Personalizado' : 'Criar Filtro Personalizado'}
                </h3>
                <button
                  onClick={handleCloseFilterModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleFilterSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Filtro
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={filterForm.title}
                    onChange={handleFilterChange}
                    placeholder="Ex: Concursos de Lisboa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                    Distrito
                  </label>
                  <select
                    id="district"
                    name="district"
                    value={filterForm.district}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="Todos">Todos os Distritos</option>
                    {districts.map((district, index) => (
                      <option key={index} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="municipality" className="block text-sm font-medium text-gray-700 mb-1">
                    Concelho
                  </label>
                  <div className="flex space-x-2">
                    <select
                      id="municipality"
                      name="municipality"
                      value={filterForm.municipality}
                      onChange={handleFilterChange}
                      onKeyPress={handleMunicipalityKeyPress}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      title="Selecione um município e pressione Enter para adicionar"
                    >
                      <option value="Todos">Todos os Municípios</option>
                      {municipalities.map((municipality, index) => (
                        <option key={index} value={municipality}>
                          {municipality}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addMunicipality}
                      disabled={filterForm.municipality === 'Todos' || selectedMunicipalities.includes(filterForm.municipality)}
                      className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                      title="Adicionar município selecionado"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Lista de municípios selecionados */}
                  {selectedMunicipalities.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Municípios selecionados:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedMunicipalities.map((municipality, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                          >
                            {municipality}
                            <button
                              type="button"
                              onClick={() => removeMunicipality(municipality)}
                              className="ml-1 text-green-600 hover:text-green-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                    Palavras-Chave
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      id="keywords"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={handleKeywordKeyPress}
                      placeholder="Digite uma palavra-chave e pressione Enter"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      type="button"
                      onClick={addKeyword}
                      disabled={!keywordInput.trim() || selectedKeywords.includes(keywordInput.trim())}
                      className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Lista de palavras-chave selecionadas */}
                  {selectedKeywords.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Palavras-chave selecionadas:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                          >
                            {keyword}
                            <button
                              type="button"
                              onClick={() => removeKeyword(keyword)}
                              className="ml-1 text-purple-600 hover:text-purple-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseFilterModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingFilter}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingFilter 
                      ? (editingFilter ? 'Atualizando...' : 'Criando...') 
                      : (editingFilter ? 'Atualizar Filtro' : 'Criar Filtro')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sessão Necessária */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Sessão Necessária
              </h3>
              
              <p className="text-sm text-gray-600 text-center mb-6">
                {sessionModalType === 'favoritos' 
                  ? 'Está a navegar como convidado. Crie uma conta para ter acesso aos favoritos.'
                  : 'Está a navegar como convidado. Crie uma conta para ter acesso ao dashboard.'
                }
              </p>
              
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out"
                >
                  Fazer Login
                </Link>
                
                <Link
                  href="/signup"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out"
                >
                  Criar Conta
                </Link>
              </div>
              
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowSessionModal(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Eliminação */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Eliminar Filtro
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Tem certeza que deseja eliminar o filtro <strong>"{filterToDelete?.nome}"</strong>? 
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={cancelDeleteFilter}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteFilter}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificação */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={closeNotification}
        duration={4000}
      />
    </div>
  )
}
