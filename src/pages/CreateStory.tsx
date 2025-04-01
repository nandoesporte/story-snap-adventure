
  const renderStep = () => {
    switch (step) {
      case "prompt":
        return (
          <>
            {apiKeyError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Atenção!</AlertTitle>
                <AlertDescription>
                  A chave da API OpenAI não está configurada ou é inválida. Configure-a nas configurações para poder gerar histórias.
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                      Ir para Configurações
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <StoryPromptInput 
              onSubmit={handlePromptSubmit}
              availablePrompts={availablePrompts}
              selectedPromptId={selectedPromptId}
              onPromptSelect={setSelectedPromptId}
              loadingPrompts={loadingPrompts}
            />
          </>
        );
        
      case "details":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">
              Personalize a história
            </h2>
            
            {apiKeyError && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Atenção!</AlertTitle>
                <AlertDescription>
                  A chave da API OpenAI não está configurada ou é inválida. Configure-a nas configurações para poder gerar histórias.
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
                      Ir para Configurações
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {loadingSuggestions ? (
              <div className="flex justify-center items-center p-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent"></div>
                  <p className="text-violet-700">Analisando seu prompt e gerando sugestões...</p>
                </div>
              </div>
            ) : (
              <>
                {storyPrompt && (
                  <div className="mb-6 p-4 bg-violet-50 rounded-lg border border-violet-100">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-5 w-5 text-violet-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-violet-800 mb-1">Sua descrição</p>
                        <p className="text-sm text-violet-700">{storyPrompt}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {aiSuggestions && (
                  <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-teal-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-teal-800 mb-1">Sugestões da IA</p>
                        <p className="text-sm text-teal-700">
                          Com base na sua descrição, sugerimos:
                          {aiSuggestions.theme && (
                            <span className="block mt-1">
                              <strong>Tema:</strong> {aiSuggestions.theme}
                            </span>
                          )}
                          {aiSuggestions.setting && (
                            <span className="block">
                              <strong>Cenário:</strong> {aiSuggestions.setting}
                            </span>
                          )}
                          {aiSuggestions.moral && (
                            <span className="block">
                              <strong>Moral:</strong> {aiSuggestions.moral}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedPromptId && (
                  <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-indigo-800 mb-1">
                          Prompt selecionado: {availablePrompts.find(p => p.id === selectedPromptId)?.name}
                        </p>
                        <p className="text-sm text-indigo-700">
                          {availablePrompts.find(p => p.id === selectedPromptId)?.description || "Prompt personalizado para geração de histórias."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <StoryForm 
                  onSubmit={handleFormSubmit} 
                  initialData={formData} 
                  suggestions={aiSuggestions}
                />
              </>
            )}
            
            <div className="mt-8 flex justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("prompt")}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:shadow hover:bg-slate-50 transition-all"
              >
                Voltar
              </motion.button>
            </div>
          </motion.div>
        );
        
      default:
        return null;
    }
  };
