import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [status, setStatus] = useState(null);
  const [eventConfig, setEventConfig] = useState({ version: '', dateStart: '', dateEnd: '' });
  const [currentBatch, setCurrentBatch] = useState([]);
  const [clickedNumbers, setClickedNumbers] = useState(new Set()); // Track which numbers from current batch are clicked
  const [visibleBatchCount, setVisibleBatchCount] = useState(0);
  const [allPicked, setAllPicked] = useState([]);
  const [discarded, setDiscarded] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  // Loading animation texts
  const loadingTexts = [
    '🎲 Shaking the raffle bucket...',
    '🎰 Mixing the numbers...',
    '🎪 Spinning the wheel of fortune...',
    '🎁 Selecting your lucky numbers...',
    '🎉 Almost there, get ready...',
    '🎊 Drawing the winners...',
    '🌟 Your numbers are coming up...',
  ];

  useEffect(() => {
    fetchConfig();
    fetchStatus();
    fetchPicked();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/config`);
      const data = await response.json();
      setEventConfig(data);
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  // Staggered reveal animation for batch numbers
  useEffect(() => {
    if (currentBatch.length > 0) {
      setVisibleBatchCount(0);
      // Reset and then reveal numbers one by one with 0.25s delay
      const timers = currentBatch.map((_, index) => {
        return setTimeout(() => {
          setVisibleBatchCount(index + 1);
        }, index * 250); // 0.25 seconds = 250ms
      });
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [currentBatch]);

  useEffect(() => {
    let interval;
    if (loading) {
      let textIndex = 0;
      interval = setInterval(() => {
        setLoadingText(loadingTexts[textIndex % loadingTexts.length]);
        textIndex++;
      }, 300);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchPicked = async () => {
    try {
      const response = await fetch(`${API_URL}/api/picked`);
      const data = await response.json();
      setAllPicked(data.picked || []);
    } catch (error) {
      console.error('Error fetching picked numbers:', error);
    }
  };

  const pickBatch = async () => {
    if (loading || !status || status.picked >= status.totalPick) return;

    // Discard unclicked numbers from previous batch
    if (currentBatch.length > 0) {
      const unclicked = currentBatch.filter(num => !clickedNumbers.has(num));
      if (unclicked.length > 0) {
        setDiscarded(prev => [...prev, ...unclicked]);
        // Notify backend to discard remaining selected
        try {
          await fetch(`${API_URL}/api/discard-selected`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.error('Error discarding selected:', error);
        }
      }
    }

    setLoading(true);
    setCurrentBatch([]);
    setClickedNumbers(new Set()); // Reset clicked numbers
    setLoadingText(loadingTexts[0]);

    try {
      // Simulate hacker loading delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const response = await fetch(`${API_URL}/api/pick-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to pick batch');
      }

      const data = await response.json();
      setCurrentBatch(data.batch);
      setVisibleBatchCount(0); // Reset visible count for new batch
      setStatus({
        ...status,
        remaining: data.remaining,
        picked: data.picked,
      });
      // Don't automatically add to picked - user must click
    } catch (error) {
      console.error('Error picking batch:', error);
      alert('Error picking batch. Make sure the server is running.');
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  const handleNumberClick = async (num) => {
    // If already clicked, do nothing
    if (clickedNumbers.has(num)) return;

    try {
      // Send to backend to add to picked
      const response = await fetch(`${API_URL}/api/pick-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: num }),
      });

      if (!response.ok) {
        throw new Error('Failed to pick number');
      }

      // Add to clicked set
      setClickedNumbers(prev => new Set([...prev, num]));
      
      // Add to picked list
      setAllPicked(prev => [...prev, num].sort((a, b) => a - b));
      
      // Update status
      await fetchStatus();
    } catch (error) {
      console.error('Error picking number:', error);
      alert('Error picking number. Make sure the server is running.');
    }
  };

  const handleSelectAll = async () => {
    if (currentBatch.length === 0) return;

    // Get all unclicked numbers
    const unclicked = currentBatch.filter(num => !clickedNumbers.has(num));
    
    if (unclicked.length === 0) return;

    // Pick all unclicked numbers one by one
    for (const num of unclicked) {
      await handleNumberClick(num);
    }
  };

  const resetLottery = async () => {
    if (!window.confirm('Are you sure you want to reset the lottery?')) return;

    try {
      const response = await fetch(`${API_URL}/api/reset`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset');
      }

      await fetchStatus();
      await fetchPicked();
      setCurrentBatch([]);
      setClickedNumbers(new Set());
      setVisibleBatchCount(0);
      setDiscarded([]);
    } catch (error) {
      console.error('Error resetting lottery:', error);
      alert('Error resetting lottery. Make sure the server is running.');
    }
  };

  const isComplete = status && allPicked.length >= status.totalPick;
  
  // Sort picked numbers numerically
  const sortedPicked = [...allPicked].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-20 gap-1 h-full w-full" style={{
          backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full scan-line"></div>
      </div>

      <div className="relative z-10 p-6 md:p-12">
        {/* Logo in top left */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20" style={{ transform: 'scale(1.0)', transformOrigin: 'top left' }}>
          <img 
            src="/nutanix-hackathon-logo.png" 
            alt="Nutanix Hackathon XII 2026 Winner"
            className="h-20 md:h-24 w-auto logo-glow"
            style={{
              opacity: 1,
              maxWidth: '200px'
            }}
          />
        </div>

        {/* Logo in top right */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20" style={{ transform: 'scale(1.0)', transformOrigin: 'top right' }}>
          <img 
            src="/nutanix-hackathon-logo.png" 
            alt="Nutanix Hackathon XII 2026 Winner"
            className="h-20 md:h-24 w-auto logo-glow"
            style={{
              opacity: 1,
              maxWidth: '200px'
            }}
          />
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-2 text-glow-mellow tracking-widest">
            ▓▓▓ NX {eventConfig.version} RAFFLE PARTY ▓▓▓
          </h1>
          <div className="text-green-500 text-sm md:text-base text-glow-mellow">
            <span className="animate-flicker">█</span> {eventConfig.dateStart} - {eventConfig.dateEnd} <span className="animate-flicker">█</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-center items-center">
          <button
            onClick={pickBatch}
            disabled={loading || isComplete}
            className="px-8 py-4 border-2 border-green-400 bg-black hover:bg-green-400 hover:text-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-lg font-bold uppercase tracking-wider"
          >
            {loading ? 'MIXING UP...' : isComplete ? 'BINGO' :  "DRAW RAFFLES"}
          </button>
          
          <button
            onClick={resetLottery}
            disabled={loading}
            className="px-6 py-4 border border-red-400 text-red-400 bg-black hover:bg-red-400 hover:text-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            RESET
          </button>
        </div>

        {/* Loading Animation */}
        {loading && (
          <div className="mb-6 p-4 border border-green-400 bg-black bg-opacity-50">
            <div className="flex items-center gap-4">
              <div className="animate-pulse text-green-400 text-2xl">█</div>
              <div className="flex-1">
                <div className="text-green-400 font-bold mb-2">{loadingText}</div>
                <div className="w-full bg-green-900 h-2 border border-green-400">
                  <div className="bg-green-400 h-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-green-500 font-mono">
              {'>'} Generating secure random sequence...
            </div>
          </div>
        )}

        {/* Current Batch Display - Hide when complete */}
        {currentBatch.length > 0 && !isComplete && (
          <div className="mb-6 p-6 border-2 border-green-400 bg-black bg-opacity-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-glow-mellow">
                ⚡ LATEST DRAW ⚡
              </h2>
              <button
                onClick={handleSelectAll}
                disabled={currentBatch.every(num => clickedNumbers.has(num))}
                className="px-4 py-2 border border-green-400 bg-black hover:bg-green-400 hover:text-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-wider"
              >
                ALL
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {currentBatch.map((num, idx) => {
                const isVisible = idx < visibleBatchCount;
                const isClicked = clickedNumbers.has(num);
                return (
                  <div
                    key={`${num}-${idx}`}
                    onClick={() => handleNumberClick(num)}
                    className={`px-4 py-3 border-2 text-center font-bold text-xl cursor-pointer transition-all ${
                      isVisible && !isClicked ? 'glitter fade-in' : ''
                    } ${
                      isClicked 
                        ? 'border-green-600 bg-green-950 bg-opacity-30 opacity-40 cursor-not-allowed' 
                        : 'border-green-400 bg-green-900 bg-opacity-30 hover:border-green-300 hover:bg-green-800 hover:bg-opacity-40'
                    }`}
                    style={{ 
                      opacity: isVisible ? (isClicked ? 0.4 : 1) : 0,
                      animationDelay: isVisible ? '0s' : '0s',
                    }}
                    title={isClicked ? 'Already picked' : 'Click to pick this number'}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Picked Numbers */}
        <div className={`p-6 border border-green-400 bg-black bg-opacity-50 ${isComplete ? 'min-h-[70vh]' : ''}`}>
          <h2 className="text-xl font-bold mb-4 text-center text-glow-mellow">
            {isComplete ? (
              <span className="text-2xl">🎉 THANK YOU FOR PARTICIPATING! 🎉</span>
            ) : (
              `ALL PICKED NUMBERS (${allPicked.length}/${status?.totalPick || 0})`
            )}
          </h2>
          <div className={isComplete ? 'overflow-y-auto custom-scrollbar' : 'max-h-96 overflow-y-auto custom-scrollbar'}>
            <div className="grid grid-cols-10 gap-3">
              {sortedPicked.map((num, idx) => (
                <span
                  key={`picked-${num}-${idx}`}
                  className={`px-4 py-3 border border-green-700 bg-green-900 bg-opacity-20 font-semibold hover:border-green-400 hover:bg-green-900 hover:bg-opacity-40 transition-all text-center ${
                    isComplete ? 'text-lg' : 'text-base'
                  }`}
                >
                  {num}
                </span>
              ))}
            </div>
            {sortedPicked.length === 0 && (
              <div className="text-center text-green-700 py-8">
                Waiting for the raffle to start...
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-green-700">
          <div className="mb-2">(c) NUTANIX INC 2026</div>
          <div className="animate-flicker">█</div>
        </div>
      </div>
    </div>
  );
}

export default App;
