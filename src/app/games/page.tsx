'use client';
import { games } from '../../data/games';

export default function GamesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '3rem' }}>
      
      {games.map(game => (
        <section key={game.id}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{game.icon}</span>
            <span style={{ 
              background: 'linear-gradient(to right, #fff, #bbb)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {game.name}
            </span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Version & Character Info Section */}
            {game.versions && game.versions.length > 0 && (
              <div style={{ 
                padding: '1.5rem', 
                backgroundColor: 'rgba(0, 0, 0, 0.6)', 
                borderRadius: '16px', 
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column', gap: '2.5rem' // Added gap here for spacing between versions
              }}>
                {game.versions.map((ver, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ 
                        backgroundColor: 'var(--color-primary)', 
                        color: 'white', 
                        padding: '0.2rem 0.8rem', 
                        borderRadius: '20px', 
                        fontWeight: 'bold' 
                      }}>
                        v{ver.version} 版本
                      </span>
                    </div>
                    
                    {/* Character Grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                       {ver.characters.map((char, cIdx) => (
                         <div key={cIdx} style={{
                           padding: '0.5rem 1.2rem',
                           backgroundColor: 'rgba(255, 255, 255, 0.1)',
                           border: '1px solid rgba(255,255,255,0.2)',
                           borderRadius: '8px',
                           color: '#fff',
                           fontWeight: 'bold',
                           display: 'flex', alignItems: 'center', gap: '0.8rem'
                         }}>
                            <span>⭐</span> {char.name}
                            
                            {/* Resonance Code Copy Button */}
                            {char.resonanceCode && (
                              <button 
                                onClick={() => {
                                  if (char.resonanceCode) {
                                    navigator.clipboard.writeText(char.resonanceCode);
                                    alert(`已複製 ${char.name} 的共鳴譜代碼：\n${char.resonanceCode}`);
                                  }
                                }}
                                title="點擊複製共鳴譜代碼"
                                style={{
                                  background: 'rgba(255,255,255,0.2)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  color: '#aaaaff', // Light blue tint
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                              >
                                📋 複製共鳴譜分享碼
                              </button>
                            )}
                         </div>
                       ))}
                    </div>
                    
                    {/* Version Specific Links */}
                    {ver.links && ver.links.length > 0 && (
                      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                         {ver.links.map(vLink => (
                            <a 
                              key={vLink.id}
                              href={vLink.url}
                              target="_blank"
                              className="card-hover" // We can add a simple hover effect class globally or inline
                              style={{
                                 display: 'block',
                                 textDecoration: 'none',
                                 backgroundColor: 'rgba(255,255,255,0.05)',
                                 padding: '1rem',
                                 borderRadius: '8px',
                                 border: '1px solid rgba(255,255,255,0.1)',
                                 color: '#e2e8f0'
                              }}
                            >
                               <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.3rem', color: '#60a5fa' }}>{vLink.title}</div>
                               <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{vLink.description}</div>
                            </a>
                         ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Links Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {game.links.map(link => (
                <a 
                  key={link.id} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="card"
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.9)', // Much darker and opaque for contrast
                    padding: '1.5rem',
                    textDecoration: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s ease',
                    color: 'white'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#60a5fa' }}>{link.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                    {link.description || '點擊前往連結'}
                  </p>
                  <div style={{ marginTop: '1rem', textAlign: 'right', fontSize: '0.9rem', color: '#94a3b8' }}>
                    前往 &rarr;
                  </div>
                </a>
              ))}
            </div>
            
          </div>
        </section>
      ))}

    </div>
  );
}
