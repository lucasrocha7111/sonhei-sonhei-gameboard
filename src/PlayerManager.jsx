import React, { useState } from 'react';

const PlayerManager = ({ onStartGame, onNewRound }) => {
  const [numPlayers, setNumPlayers] = useState(0);
  const [players, setPlayers] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [currentDreamer, setCurrentDreamer] = useState(0);
  const [rolesAssigned, setRolesAssigned] = useState(false);

  const assignRoles = () => {
    const newRoles = [];
    for (let i = 0; i < numPlayers; i++) {
      newRoles.push(i === currentDreamer ? 'Sonhador' : Math.random() < 0.5 ? 'Espírito da Luz' : 'Espírito da Escuridão');
    }
    const shuffledRoles = newRoles.sort(() => Math.random() - 0.5);
    const newPlayers = Array.from({ length: numPlayers }, (_, index) => ({
      id: index + 1,
      role: shuffledRoles[index],
      revealed: false
    }));
    setPlayers(newPlayers);
    setRolesAssigned(true);
  };

  const handleStartGame = () => {
    onStartGame(players);
  };

  const revealRole = (index) => {
    setPlayers(players.map((player, idx) => idx === index ? { ...player, revealed: true } : player));
  };

  return (
    <div>
      <h2>Gerenciador de Jogadores</h2>
      <label>
        Número de Jogadores:
        <input type="number" value={numPlayers} onChange={(e) => setNumPlayers(Number(e.target.value))} />
      </label>
      <button onClick={assignRoles}>Atribuir Papéis</button>
      <button onClick={handleStartGame} disabled={!rolesAssigned}>Iniciar Jogo</button>
      <div>
        {players.map((player, index) => (
          <div key={index}>
            Jogador {player.id}: {player.revealed ? player.role : '???'}
            <button onClick={() => revealRole(index)}>Revelar</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerManager;
