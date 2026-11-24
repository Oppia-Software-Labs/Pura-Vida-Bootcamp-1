import React, { useState } from 'react';
import { Project, ProjectCategory, JobType } from '../types';
import { X, Sparkles, Coins, Flag, Building2, Layers } from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
  onAddProject: (project: Project) => void;
  publisherAddress: string | null;
}

const LATAM_COUNTRIES = [
  { flag: '🇨🇷', name: 'Costa Rica', city: 'San José' },
  { flag: '🇨🇴', name: 'Colombia', city: 'Bogotá' },
  { flag: '🇲🇽', name: 'México', city: 'Ciudad de México' },
  { flag: '🇦🇷', name: 'Argentina', city: 'Buenos Aires' },
  { flag: '🇨🇱', name: 'Chile', city: 'Santiago' },
  { flag: '🇵🇪', name: 'Perú', city: 'Lima' },
  { flag: '🇧🇷', name: 'Brasil', city: 'São Paulo' },
  { flag: '🇬🇹', name: 'Guatemala', city: 'Ciudad de Guatemala' },
  { flag: '🇵🇦', name: 'Panamá', city: 'Ciudad de Panamá' },
  { flag: '🌎', name: 'Remoto LATAM', city: 'Toda Latinoamérica' },
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  onClose,
  onAddProject,
  publisherAddress
}) => {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(LATAM_COUNTRIES[0]);
  const [category, setCategory] = useState<ProjectCategory>('Soroban');
  const [type, setType] = useState<JobType>('Bounty');
  const [rewardXlm, setRewardXlm] = useState<number>(3000);
  const [description, setDescription] = useState('');
  const [requirementsText, setRequirementsText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !description.trim()) return;

    const reqs = requirementsText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      title: title.trim(),
      company: company.trim(),
      location: `${selectedCountry.city}, ${selectedCountry.name}`,
      countryFlag: selectedCountry.flag,
      category,
      type,
      rewardXlm: Number(rewardXlm) || 1000,
      description: description.trim(),
      requirements: reqs.length > 0 ? reqs : ['Desarrollo Web3 en Stellar', 'Buenas prácticas de código'],
      publisherAddress: publisherAddress || 'GBRANDOMPUBLISHERFORTESTINGBOOTCAMPPURAVIDA928374',
      status: 'open',
      createdAt: new Date().toISOString().split('T')[0],
      applicants: []
    };

    onAddProject(newProject);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-subtitle-badge">
              <Sparkles size={14} /> Nuevo Empleo / Bounty Web3
            </div>
            <h2 className="modal-title">Publicar Proyecto remunerado en XLM</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body form-grid">
          <div className="form-group">
            <label>Título del Proyecto / Posición</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ej. Smart Contract Soroban para Swap Automatizado"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Empresa o Proyecto</label>
              <div className="input-with-icon">
                <Building2 size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. Stellar Labs CR"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>País / Ubicación en LATAM</label>
              <div className="input-with-icon">
                <Flag size={16} className="input-icon" />
                <select
                  className="form-select"
                  value={selectedCountry.name}
                  onChange={(e) => {
                    const country = LATAM_COUNTRIES.find((c) => c.name === e.target.value);
                    if (country) setSelectedCountry(country);
                  }}
                >
                  {LATAM_COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoría</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
              >
                <option value="Soroban">Soroban (Smart Contracts)</option>
                <option value="Frontend">Frontend Web3 (React/Vite)</option>
                <option value="Backend">Backend & Horizon APIs</option>
                <option value="Fullstack">Fullstack dApp</option>
                <option value="Security">Auditoría & Seguridad</option>
              </select>
            </div>

            <div className="form-group">
              <label>Modalidad</label>
              <select
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as JobType)}
              >
                <option value="Bounty">Bounty (Por tarea específica)</option>
                <option value="Gig">Gig (Freelance corto)</option>
                <option value="Part-time">Medio Tiempo</option>
                <option value="Full-time">Tiempo Completo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Recompensa en XLM</label>
              <div className="input-with-icon">
                <Coins size={16} className="input-icon text-stellar" />
                <input
                  type="number"
                  min="50"
                  step="50"
                  className="form-input"
                  placeholder="3000"
                  value={rewardXlm}
                  onChange={(e) => setRewardXlm(Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Descripción detallada de la necesidad</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Explica qué problema debe resolver el desarrollador, qué entregables se esperan y el tiempo límite estimado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Requisitos técnicos (uno por línea)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Soroban SDK v22&#10;Rust intermedio/avanzado&#10;Familiaridad con Freighter"
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Sparkles size={16} className="btn-icon" />
              Publicar Bounty ({rewardXlm.toLocaleString()} XLM)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
