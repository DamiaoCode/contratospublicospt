'use client'

import { useState } from 'react'

interface ContestCardProps {
  concurso: {
    id: string
    n_procedimento: string
    titulo: string
    entidade: string
    data_envio: string
    prazo_propostas: string
    preco_base: number
    prazo_execucao: string
    urgente: boolean
    distrito?: string
    concelho?: string
    monofator?: string
    multifator?: string
    url_apresentacao?: string
    plataforma?: string
    fonte_pdf?: string
  }
  isFavorited: boolean
  isExpanded: boolean
  onToggleFavorite: (concursoId: string) => void
  onToggleExpansion: (concursoId: string) => void
  calculateTimeRemaining: (prazoPropostas: string) => {
    text: string
    color: string
  } | null
}

export default function ContestCard({
  concurso,
  isFavorited,
  isExpanded,
  onToggleFavorite,
  onToggleExpansion,
  calculateTimeRemaining
}: ContestCardProps) {
  return (
    <div className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 relative ${
      isExpanded 
        ? 'border-green-400 shadow-lg shadow-green-100 bg-green-50/30' 
        : 'border-gray-200'
    }`}>
      {/* Ícone de estrela no canto superior direito */}
      <button
        onClick={() => onToggleFavorite(concurso.id)}
        className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
        title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <svg 
          className={`w-5 h-5 transition-colors ${
            isFavorited 
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
          onClick={() => onToggleExpansion(concurso.id)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <span>{isExpanded ? 'Menos detalhes' : 'Mais detalhes'}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Seção expandida com todos os detalhes */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Detalhes Completos</h5>
          <div className="space-y-3 text-sm">
            {/* Informações básicas */}
            <div>
              <span className="font-medium text-gray-600">Título:</span>{' '}
              {concurso.titulo && concurso.titulo.length >= 60
                ? `${concurso.titulo.slice(0, 57)}(...)`
                : concurso.titulo}
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
                  {concurso.plataforma || 'Acessar Plataforma'}
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
  )
}
