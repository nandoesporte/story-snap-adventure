
import { useState } from "react";
import { motion } from "framer-motion";

export interface StoryFormData {
  childName: string;
  childAge: string;
  theme: string;
  setting: string;
}

interface StoryFormProps {
  onSubmit: (data: StoryFormData) => void;
}

const StoryForm = ({ onSubmit }: StoryFormProps) => {
  const [formData, setFormData] = useState<StoryFormData>({
    childName: "",
    childAge: "",
    theme: "adventure",
    setting: "forest"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const themes = [
    { id: "adventure", name: "Aventura" },
    { id: "fantasy", name: "Fantasia" },
    { id: "space", name: "Espaço" },
    { id: "ocean", name: "Oceano" },
    { id: "dinosaurs", name: "Dinossauros" }
  ];

  const settings = [
    { id: "forest", name: "Floresta Encantada" },
    { id: "castle", name: "Castelo Mágico" },
    { id: "space", name: "Espaço Sideral" },
    { id: "underwater", name: "Mundo Submarino" },
    { id: "dinosaurland", name: "Terra dos Dinossauros" }
  ];

  return (
    <motion.form 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="childName" className="block text-sm font-medium mb-1">
              Nome da criança
            </label>
            <input
              id="childName"
              name="childName"
              type="text"
              required
              value={formData.childName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50 transition-all"
              placeholder="Ex: Sofia"
            />
          </div>
          
          <div>
            <label htmlFor="childAge" className="block text-sm font-medium mb-1">
              Idade
            </label>
            <input
              id="childAge"
              name="childAge"
              type="text"
              required
              value={formData.childAge}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50 transition-all"
              placeholder="Ex: 5 anos"
            />
          </div>
          
          <div>
            <label htmlFor="theme" className="block text-sm font-medium mb-1">
              Tema da história
            </label>
            <div className="relative">
              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50 transition-all appearance-none"
              >
                {themes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label htmlFor="setting" className="block text-sm font-medium mb-1">
              Cenário
            </label>
            <div className="relative">
              <select
                id="setting"
                name="setting"
                value={formData.setting}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-storysnap-blue/50 transition-all appearance-none"
              >
                {settings.map(setting => (
                  <option key={setting.id} value={setting.id}>
                    {setting.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full py-3 px-4 bg-storysnap-blue text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-storysnap-blue/90 transition-all"
        >
          Gerar História
        </motion.button>
      </div>
    </motion.form>
  );
};

export default StoryForm;
