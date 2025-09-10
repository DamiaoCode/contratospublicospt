'use client'

import { useState, useEffect } from 'react'
import Topbar from '@/components/Topbar'

export default function ComoUtilizar() {
  const [showBackToTop, setShowBackToTop] = useState(false)

  // Detectar scroll para mostrar botão "Voltar ao Topo"
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Função para scroll suave para âncoras
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  // Função para voltar ao topo
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }


  return (
    <div className="min-h-screen bg-gray-50" style={{ scrollBehavior: 'smooth' }}>
      <Topbar activeFavoritedCount={0} />

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Cabeçalho */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Como Utilizar
            </h1>
            <p className="text-gray-600">
              Guia completo para utilizar o sistema de concursos públicos
            </p>
          </div>

          {/* Conteúdo da Página */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="prose prose-lg max-w-none">
              <h1 className="text-3xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Como Utilizar o Sistema de Concursos Públicos
              </h1>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Bem-vindo ao sistema de gestão de concursos públicos! Este guia irá ajudá-lo a navegar e utilizar todas as funcionalidades disponíveis.
              </p>

              {/* Índice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">📋 Índice</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>
                    <button 
                      onClick={() => scrollToSection('visao-geral')}
                      className="text-blue-600 hover:text-blue-800 underline text-left"
                    >
                      Visão Geral
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollToSection('navegacao-principal')}
                      className="text-blue-600 hover:text-blue-800 underline text-left"
                    >
                      Navegação Principal
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollToSection('busca-e-filtros')}
                      className="text-blue-600 hover:text-blue-800 underline text-left"
                    >
                      Busca e Filtros
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollToSection('favoritos')}
                      className="text-blue-600 hover:text-blue-800 underline text-left"
                    >
                      Favoritos
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollToSection('paginas-de-entidade')}
                      className="text-blue-600 hover:text-blue-800 underline text-left"
                    >
                      Páginas de Entidade
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => scrollToSection('dicas-e-truques')}
                      className="text-blue-600 hover:text-blue-800 underline text-left"
                    >
                      Dicas e Truques
                    </button>
                  </li>
                </ul>
              </div>

              {/* Visão Geral */}
              <section id="visao-geral" className="scroll-mt-20">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">🎯 Visão Geral</h2>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  O sistema permite-lhe:
                </p>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Procurar concursos</strong> por nome, entidade, nº procedimento ou publicação</li>
                  <li><strong>Filtrar concursos</strong> por distrito, município e palavras-chave</li>
                  <li><strong>Guardar concursos como favoritos</strong> para acompanhamento</li>
                  <li><strong>Visualizar detalhes</strong> completos de cada concurso</li>
                  <li><strong>Acompanhar prazos</strong> de forma organizada</li>
                </ul>
              </section>

              {/* Navegação Principal */}
              <section id="navegacao-principal" className="scroll-mt-20">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">🏠 Navegação Principal</h2>
                
                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Página Inicial</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Lista de concursos</strong> ordenados por prazo (mais próximos de expirar primeiro)</li>
                  <li><strong>Barra de pesquisa</strong> para busca rápida</li>
                  <li><strong>Filtros personalizados</strong> para refinar resultados</li>
                  <li><strong>Abas Ativos/Expirados</strong> para separar concursos por status</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Topbar</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Logo</strong> - clique para voltar à página inicial</li>
                  <li><strong>Favoritos</strong> - acesse seus concursos favoritados</li>
                  <li><strong>Dashboard</strong> - área onde pode ver favoritos ou acompanhar entidades</li>
                  <li><strong>Login/Logout</strong> - gestão de conta</li>
                </ul>
              </section>

              {/* Busca e Filtros */}
              <section id="busca-e-filtros" className="scroll-mt-20">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">🔍 Busca e Filtros</h2>
                
                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Busca Simples</h3>
                <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-1">
                  <li>Digitar na barra de pesquisa</li>
                  <li>Pressione Enter</li>
                  <li>Os resultados são filtrados automaticamente</li>
                </ol>

                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Filtros Personalizados</h3>
                <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-1">
                  <li>Clique em <strong>"Meus Filtros"</strong> para expandir</li>
                  <li>Clique em <strong>"Criar Filtro"</strong> para novo filtro</li>
                  <li>Configure:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li><strong>Nome do filtro</strong> (ex: "Concursos de Lisboa")</li>
                      <li><strong>Distrito</strong> (opcional)</li>
                      <li><strong>Concelhos</strong> (pode adicionar vários)</li>
                      <li><strong>Palavras-chave</strong> (termos específicos)</li>
                    </ul>
                  </li>
                </ol>

                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Aplicar Filtros</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li>Marque os filtros desejados</li>
                  <li>Os resultados são atualizados automaticamente</li>
                  <li>Combine múltiplos filtros para busca mais específica</li>
                </ul>
              </section>

              {/* Favoritos */}
              <section id="favoritos" className="scroll-mt-20">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">⭐ Favoritos</h2>
                
                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Adicionar aos Favoritos</h3>
                <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-1">
                  <li>Clique no ícone de estrela em qualquer concurso</li>
                  <li>A estrela fica preenchida (⭐) quando marcado como favorito</li>
                  <li>Acesse via "Favoritos" no topbar</li>
                </ol>

                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Gerir Favoritos</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Página de Favoritos</strong> mostra todos os concursos salvos</li>
                  <li><strong>Abas Ativos/Expirados</strong> para organizar</li>
                  <li><strong>Remover</strong> clicando novamente na estrela</li>
                </ul>
              </section>

              {/* Páginas de Entidade */}
              <section id="paginas-de-entidade" className="scroll-mt-20">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">🏢 Páginas de Entidade</h2>
                
                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Acessar Entidade</h3>
                <ol className="list-decimal list-inside text-gray-600 mb-4 space-y-1">
                  <li>Clique no nome da entidade em qualquer concurso</li>
                  <li>Visualize todos os concursos dessa entidade</li>
                  <li>Mesma funcionalidade de filtros e favoritos</li>
                </ol>

                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Informações da Entidade</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Nome completo</strong> da entidade</li>
                  <li><strong>NIPC</strong> (Número de Identificação de Pessoa Coletiva)</li>
                  <li><strong>Lista completa</strong> de concursos ativos e expirados</li>
                </ul>
              </section>

              {/* Dicas e Truques */}
              <section id="dicas-e-truques" className="scroll-mt-20">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">💡 Dicas e Truques</h2>
                
                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Organização</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Use filtros personalizados</strong> para concursos específicos</li>
                  <li><strong>Crie favoritos de concursos importantes</strong> para acesso rápido</li>
                  <li><strong>Verifique regularmente</strong> a aba "Ativos" para não perder prazos</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Busca Eficiente</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Use palavras-chave específicas</strong> (ex: "técnico", "enfermeiro", "ramais")</li>
                  <li><strong>Combine distrito + município</strong> para resultados locais</li>
                  <li><strong>Salve filtros frequentes</strong> para reutilização</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Acompanhamento de Prazos</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Concursos próximos do prazo</strong> aparecem primeiro por predefinição</li>
                  <li><strong>Cores indicam urgência</strong>:
                    <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                      <li>🟢 Verde: Mais de 7 dias</li>
                      <li>🟠 Laranja: 1-7 dias ou expira amanhã</li>
                      <li>🔴 Vermelho: Expirado</li>
                    </ul>
                  </li>
                </ul>
              </section>

              {/* Funcionalidades Técnicas */}
              <section className="scroll-mt-20">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">🔧 Funcionalidades Técnicas</h2>
                
                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Responsividade</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Mobile-friendly</strong> - funciona em todos os dispositivos</li>
                  <li><strong>Interface adaptativa</strong> - otimizada para cada tela</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Performance</h3>
                <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                  <li><strong>Carregamento rápido</strong> de dados</li>
                  <li><strong>Filtros em tempo real</strong> sem recarregar página</li>
                  <li><strong>Cache inteligente</strong> para melhor experiência</li>
                </ul>
              </section>

              {/* Resolução de Problemas */}
              <section className="scroll-mt-20">
                <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">❓ Resolução de Problemas</h2>
                
                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Problemas Comuns</h3>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Não consigo ver concursos:</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Verifique se está na aba correta (Ativos/Expirados)</li>
                    <li>Limpe os filtros aplicados</li>
                    <li>Verifique a conexão à internet</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Filtros não funcionam:</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Certifique-se de que os filtros estão marcados</li>
                    <li>Verifique se há concursos que correspondem aos critérios</li>
                    <li>Tente remover e recriar o filtro</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Favoritos não aparecem:</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Verifique se está com sessão iniciada</li>
                    <li>Recarregue a página</li>
                    <li>Verifique se o concurso ainda está ativo</li>
                  </ul>
                </div>

                <h3 className="text-xl font-medium text-gray-700 mb-2 mt-4">Suporte</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Em caso de dúvidas ou para reportar problemas, entre em contacto pelo e-mail <a href="mailto:joaodamiaocode@gmail.com" className="text-blue-600 underline">joaodamiaocode@gmail.com</a>.
                </p>
                {/* Atualizado: 2025 */}
              </section>

              <hr className="border-gray-200 my-8" />
              
              <p className="text-gray-500 text-sm italic text-center">
                *Última atualização: Setembro 2025*
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Botão Voltar ao Topo */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50"
          aria-label="Voltar ao topo"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  )
}
