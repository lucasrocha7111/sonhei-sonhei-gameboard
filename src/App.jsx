import React, { useState, useEffect } from 'react';
import { useSprings, animated, to } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import PlayerManager from './PlayerManager';
import './App.css';
import cardData from './cards.json'; // Importar dados das cartas

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const toStyles = (rot, scale) => ({
  transform: `perspective(1500px) rotateX(30deg) rotateY(${rot / 10}deg) rotateZ(${rot}deg) scale(${scale})`
});

const fromStyles = i => ({ x: 0, rot: 0, scale: 1, y: i * 4 });

function App() {
  const [players, setPlayers] = useState([]);
  const [gone] = useState(() => new Set());
  const [direction, setDirection] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos em segundos
  const [roundEnded, setRoundEnded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [finalScores, setFinalScores] = useState([]); // Para armazenar as pontuações finais
  const [currentDreamer, setCurrentDreamer] = useState(0); // Para rastrear o sonhador atual
  const [shuffledCards, setShuffledCards] = useState(shuffleArray([...cardData])); // Cartas embaralhadas
  const [springs, api] = useSprings(shuffledCards.length, i => ({ ...fromStyles(i), from: fromStyles(i) }));

  useEffect(() => {
    if (timeLeft > 0 && !roundEnded) {
      const timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setRoundEnded(true);
    }
  }, [timeLeft, roundEnded]);

  const handleStartGame = (newPlayers) => {
    const shuffledPlayers = newPlayers.map((player, index) => ({
      ...player,
      role: index === currentDreamer ? 'Sonhador' : (Math.random() < 0.5 ? 'Espírito da Luz' : 'Espírito da Escuridão'),
      points: 0
    }));
    setPlayers(shuffledPlayers);
    setFinalScores(shuffledPlayers.map(player => ({ id: player.id, points: 0 }))); // Reseta as pontuações finais
    setTimeLeft(300); // Reseta o temporizador
    setRoundEnded(false);
    setGameStarted(true);
    setGameEnded(false);
  };

  const handleNewRound = () => {
    const newDreamer = (currentDreamer + 1) % players.length;
    setCurrentDreamer(newDreamer);
    const shuffledPlayers = players.map((player, index) => ({
      ...player,
      role: index === newDreamer ? 'Sonhador' : (Math.random() < 0.5 ? 'Espírito da Luz' : 'Espírito da Escuridão')
    }));
    setPlayers(shuffledPlayers);
    setShuffledCards(shuffleArray([...cardData])); // Embaralha as cartas
    setTimeLeft(300); // Reseta o temporizador
    setRoundEnded(false);
  };

  const handleEndRound = () => {
    setRoundEnded(true);
  };

  const handleEndGame = () => {
    const updatedFinalScores = players.map(player => {
      const finalPlayer = finalScores.find(finalPlayer => finalPlayer.id === player.id);
      return { id: player.id, points: finalPlayer.points + player.points };
    });
    setFinalScores(updatedFinalScores);
    setGameEnded(true);
  };

  const bind = useDrag(({ args: [index], down, movement: [mx], direction: [xDir], velocity }) => {
    const trigger = velocity > 0.2;
    const dir = xDir < 0 ? -1 : 1;
    if (!down && trigger) {
      gone.add(index);
      setDirection(dir === 1 ? 'direita' : 'esquerda');

      // Atualiza os pontos dos jogadores
      setPlayers(players.map(player => {
        const points = player.role === 'Sonhador' && dir === 1
          ? player.points + 1
          : (dir === 1 && player.role === 'Espírito da Luz') || (dir === -1 && player.role === 'Espírito da Escuridão')
          ? player.points + 1
          : player.points;
        return { ...player, points };
      }));
    }
    api.start(i => {
      if (index !== i) return;
      const isGone = gone.has(index);
      const x = isGone ? (200 + window.innerWidth) * dir : down ? mx : 0;
      const rot = mx / 100 + (isGone ? dir * 10 * velocity : 0);
      const scale = down ? 1.1 : 1;
      return { x, rot, scale, config: { friction: 50, tension: down ? 800 : isGone ? 200 : 500 } };
    });
    if (!down && gone.size === cardData.length) setTimeout(() => gone.clear() || api.start(i => fromStyles(i)), 600);
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="App">
      {!gameStarted && (
        <PlayerManager onStartGame={handleStartGame} />
      )}
      {gameStarted && (
        <>
          <div className="controls">
            <button onClick={handleEndRound} disabled={roundEnded}>Terminar Rodada</button>
            <button onClick={handleNewRound} disabled={!roundEnded}>Nova Rodada</button>
            <button onClick={handleEndGame}>Finalizar Jogo</button>
          </div>
          <div className="timer">Tempo Restante: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}</div>
          <div className="scores">
            <h3>Pontuações:</h3>
            {players.map(player => (
              <p key={player.id}>Jogador {player.id} ({player.role}): {player.points} pontos</p>
            ))}
          </div>
          <div className="card-container">
            {!roundEnded && springs.map(({ x, y, rot, scale }, i) => (
              <animated.div key={i} style={{ transform: to([x, y], (x, y) => `translate3d(${x}px, 0px,0)`) }}>
                <animated.div {...bind(i)} style={to([rot, scale], toStyles)}>
                  <div className="card">{shuffledCards[i].title}</div>
                </animated.div>
              </animated.div>
            ))}
            {direction && <div className="direction">Última carta lançada para a {direction}</div>}
          </div>
        </>
      )}
      {gameEnded && (
        <div className="ranking">
          <h3>Ranking Final:</h3>
          {finalScores.sort((a, b) => b.points - a.points).map(player => (
            <p key={player.id}>Jogador {player.id}: {player.points} pontos</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
