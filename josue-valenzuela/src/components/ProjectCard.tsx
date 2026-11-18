import React from 'react';
import { Project } from '../types';
import { MapPin, Users, Coins, ArrowRight, ShieldCheck, Code, Globe } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  isOwner?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect, isOwner }) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Soroban':
      case 'Smart Contracts':
        return <ShieldCheck size={14} className="tag-icon text-cyan" />;
      case 'Frontend':
      case 'Fullstack':
        return <Code size={14} className="tag-icon text-emerald" />;
      default:
        return <Globe size={14} className="tag-icon text-amber" />;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'Bounty':
        return 'badge-bounty';
      case 'Gig':
        return 'badge-gig';
      case 'Full-time':
        return 'badge-fulltime';
      default:
        return 'badge-parttime';
    }
  };

  return (
    <div className="project-card">
      {/* Header */}
      <div className="card-top">
        <div className="company-meta">
          <span className="country-flag" title={project.location}>{project.countryFlag}</span>
          <div>
            <h3 className="company-name">{project.company}</h3>
            <div className="project-location">
              <MapPin size={12} className="meta-icon" />
              {project.location}
            </div>
          </div>
        </div>

        <div className="card-badges">
          <span className={`badge ${getTypeBadgeClass(project.type)}`}>
            {project.type}
          </span>
          {isOwner && (
            <span className="badge badge-owner">Mi Proyecto</span>
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="project-title">{project.title}</h2>

      {/* Description */}
      <p className="project-desc">{project.description}</p>

      {/* Requirements preview */}
      <div className="requirements-tags">
        <span className="req-tag category-tag">
          {getCategoryIcon(project.category)}
          {project.category}
        </span>
        {project.requirements.slice(0, 2).map((req, i) => (
          <span key={i} className="req-tag">
            {req}
          </span>
        ))}
        {project.requirements.length > 2 && (
          <span className="req-tag text-muted">
            +{project.requirements.length - 2} más
          </span>
        )}
      </div>

      {/* Footer / Reward */}
      <div className="card-footer">
        <div className="reward-group">
          <div className="reward-label">Recompensa</div>
          <div className="reward-value">
            <Coins size={18} className="reward-coin-icon" />
            <span>{project.rewardXlm.toLocaleString()}</span>
            <span className="reward-currency">XLM</span>
          </div>
        </div>

        <div className="card-actions">
          <div className="applicant-stat" title={`${project.applicants.length} postulaciones registradas`}>
            <Users size={14} className="meta-icon" />
            <span>{project.applicants.length} postulados</span>
          </div>
          <button className="btn btn-outline-card" onClick={() => onSelect(project)}>
            Ver Detalles
            <ArrowRight size={14} className="btn-icon-right" />
          </button>
        </div>
      </div>
    </div>
  );
};
