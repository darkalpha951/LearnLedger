import React, { useState, useMemo, useEffect } from "react";
import { BookOpen, Search, ChevronDown, Wallet2, BarChart3, BookMarked, Award, X, Clock, ThumbsUp, Calendar } from 'lucide-react';

const MOCK_USER = {
  id: "user123",
  eduBalance: 900,
  stakedEdu: 0, // Starting with 0 staked
  vedPoints: 50,
  accessiblePapers: ["paper3"],
  votesUsed: 0, // Track votes used in current voting round
};

const MOCK_PAPERS = [
  {
    id: "paper1",
    title: "Quantum Computing",
    requiredStake: 200,
    link: "/papers/quantum-computing.pdf",
    description: "Exploring the fundamentals of quantum computing and its applications",
    sector: "AI"
  },
  {
    id: "paper2",
    title: "AI in Medicine",
    requiredStake: 150,
    link: "/papers/ai-in-medicine.pdf",
    description: "How artificial intelligence is transforming healthcare",
    sector: "AI"
  },
  {
    id: "paper3",
    title: "Open Science Movement",
    requiredStake: 0,
    link: "/papers/open-science.pdf",
    description: "The evolution and impact of open science initiatives",
    sector: "Open Science"
  },
];

const RESEARCH_SECTORS = [
  { id: "ai", name: "Artificial Intelligence", votes: 24 },
  { id: "blockchain", name: "Blockchain", votes: 16 },
  { id: "climate", name: "Climate Change & Global Warming", votes: 12 },
  { id: "nature", name: "Nature & Biodiversity", votes: 8 },
  { id: "openscience", name: "Open Science", votes: 6 }
];

// Mock voting round data
const CURRENT_VOTING_ROUND = {
  id: "Q2-2025",
  name: "Q2 2025",
  startDate: "April 1, 2025",
  endDate: "June 30, 2025",
  daysRemaining: 81,
};

function Dashboard() {
  const [user, setUser] = useState(MOCK_USER);
  const [papers] = useState(MOCK_PAPERS);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [readingTime, setReadingTime] = useState(0);
  const [readingInterval, setReadingInterval] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [sectors, setSectors] = useState(RESEARCH_SECTORS);
  const [voteAmount, setVoteAmount] = useState(1);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [votingRound] = useState(CURRENT_VOTING_ROUND);

  // Maximum votes allowed per user per voting round
  const MAX_VOTES_PER_USER = 50;
  const remainingVotes = MAX_VOTES_PER_USER - user.votesUsed;

  // Load reading times from localStorage on component mount
  useEffect(() => {
    const savedTimes = JSON.parse(localStorage.getItem('paperReadingTimes') || '{}');
    setReadingTime(savedTimes[selectedPaper?.id] || 0);
  }, [selectedPaper]);

  // Start/stop timer when paper is opened/closed
  useEffect(() => {
    if (selectedPaper) {
      const interval = setInterval(() => {
        setReadingTime(prev => {
          const newTime = prev + 1;
          const savedTimes = JSON.parse(localStorage.getItem('paperReadingTimes') || '{}');
          savedTimes[selectedPaper.id] = newTime;
          localStorage.setItem('paperReadingTimes', JSON.stringify(savedTimes));
          return newTime;
        });
      }, 1000);
      setReadingInterval(interval);

      return () => {
        clearInterval(interval);
        setReadingInterval(null);
      };
    }
  }, [selectedPaper]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  };

  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      const searchLower = searchQuery.toLowerCase();
      return (
        paper.title.toLowerCase().includes(searchLower) ||
        paper.description.toLowerCase().includes(searchLower)
      );
    }).sort((a, b) => {
      if (sortBy === "newest") {
        return -1;
      } else if (sortBy === "stake") {
        return b.requiredStake - a.requiredStake;
      }
      return a.title.localeCompare(b.title);
    });
  }, [papers, searchQuery, sortBy]);

  const handleStake = () => {
    const amount = Number(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("⚠️ Please enter a valid stake amount");
      return;
    }

    if (amount > user.eduBalance) {
      alert("⚠️ Insufficient EDU balance");
      return;
    }

    setUser(prev => ({
      ...prev,
      eduBalance: prev.eduBalance - amount,
      stakedEdu: prev.stakedEdu + amount,
      vedPoints: prev.vedPoints + 10,
    }));

    setStakeAmount("");
    alert(`✅ Successfully staked ${amount} EDU`);
  };

  const checkAccess = () => {
    if (user.accessiblePapers.includes(selectedPaperId)) {
      alert("✅ You have access to this paper.");
    } else {
      alert("❌ You do not have access to this paper.");
    }
  };

  const canAccessPaper = (requiredStake) => {
    return user.stakedEdu >= requiredStake;
  };

  const distributeRewards = () => {
    const rewardVed = user.vedPoints * 0.5;
    setUser((prev) => ({
      ...prev,
      vedPoints: 0,
    }));
    alert(`🎉 ${rewardVed.toFixed(2)} VED distributed to your account`);
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
      } catch (err) {
        console.error("Connection error:", err);
        alert("Could not connect to MetaMask");
      }
    } else {
      alert("🦊 Please install MetaMask to use this feature.");
    }
  };

  const handleClosePaper = () => {
    if (readingInterval) {
      clearInterval(readingInterval);
      setReadingInterval(null);
    }
    setSelectedPaper(null);
  };

  const handleVoteClick = (sector) => {
    if (user.vedPoints <= 0) {
      alert("⚠️ You need VED tokens to vote for research sectors");
      return;
    }
    
    if (user.votesUsed >= MAX_VOTES_PER_USER) {
      alert(`⚠️ You've reached the maximum voting limit of ${MAX_VOTES_PER_USER} VED for this voting round`);
      return;
    }
    
    setSelectedSector(sector);
    setShowVotingModal(true);
  };

  const handleCastVote = () => {
    const amount = Number(voteAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("⚠️ Please enter a valid voting amount");
      return;
    }

    if (amount > user.vedPoints) {
      alert("⚠️ Insufficient VED balance");
      return;
    }
    
    // Check if vote would exceed the maximum allowed
    if (user.votesUsed + amount > MAX_VOTES_PER_USER) {
      alert(`⚠️ This vote would exceed your limit of ${MAX_VOTES_PER_USER} VED per voting round. You can vote with up to ${remainingVotes} VED.`);
      return;
    }

    // Update sector votes
    setSectors(prev => prev.map(sector => 
      sector.id === selectedSector.id 
        ? { ...sector, votes: sector.votes + amount } 
        : sector
    ));

    // Deduct VED from user and track votes used
    setUser(prev => ({
      ...prev,
      vedPoints: prev.vedPoints - amount,
      votesUsed: prev.votesUsed + amount
    }));

    setShowVotingModal(false);
    setVoteAmount(1);
    alert(`✅ Successfully voted for ${selectedSector.name} sector with ${amount} VED`);
  };

  // Sort sectors by vote count
  const sortedSectors = [...sectors].sort((a, b) => b.votes - a.votes);

  // Calculate total votes for percentage calculation
  const totalVotes = sectors.reduce((sum, sector) => sum + sector.votes, 0);

  return (
    <div className="min-h-screen bg-[#fafafa] relative">
      {/* PDF Viewer Modal */}
      {selectedPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col relative">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-bold text-gray-900">{selectedPaper.title}</h3>
                <div className="flex items-center space-x-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Reading time: {formatTime(readingTime)}</span>
                </div>
              </div>
              <button
                onClick={handleClosePaper}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={selectedPaper.link}
                className="w-full h-full rounded-lg border border-gray-200"
                title={selectedPaper.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* Voting Modal */}
      {showVotingModal && selectedSector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Vote for Research Sector</h3>
              <button
                onClick={() => setShowVotingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-2">You are voting for:</h4>
              <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                <span className="text-blue-700 font-medium">{selectedSector.name}</span>
                <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm">
                  {selectedSector.votes} votes
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="bg-purple-50 p-3 rounded-lg mb-3">
                <div className="flex justify-between items-center text-sm text-purple-700">
                  <span>Voting limit per round: {MAX_VOTES_PER_USER} VED</span>
                  <span>Remaining: {remainingVotes} VED</span>
                </div>
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many VED tokens would you like to use?
              </label>
              <div className="flex space-x-2 items-center">
                <input
                  type="number"
                  value={voteAmount}
                  onChange={(e) => setVoteAmount(Math.max(1, Math.min(remainingVotes, Math.min(user.vedPoints, parseInt(e.target.value) || 0))))}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max={Math.min(remainingVotes, user.vedPoints)}
                />
                <span className="text-gray-500">/ {user.vedPoints} VED</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowVotingModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCastVote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cast Vote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-blue-600">LearnLedger</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Amount to stake"
                    className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleStake}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Stake EDU
                  </button>
                </div>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                  {user.stakedEdu} EDU Staked
                </span>
                <span className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-sm font-medium">
                  {user.vedPoints} VED
                </span>
                <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                  {user.eduBalance} EDU Balance
                </span>
              </div>
              
              {walletAddress ? (
                <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              ) : (
                <button
                  onClick={connectWallet}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Wallet2 className="w-4 h-4 mr-2" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search research papers..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="title">Sort by Title</option>
              <option value="newest">Newest First</option>
              <option value="stake">Highest Stake</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Featured Papers */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <BookMarked className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Featured Papers</h2>
            </div>
            
            {filteredPapers.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                <p className="text-gray-500">No papers found matching your search criteria</p>
              </div>
            ) : (
              filteredPapers.map((paper) => {
                const hasAccess = canAccessPaper(paper.requiredStake);
                const savedTimes = JSON.parse(localStorage.getItem('paperReadingTimes') || '{}');
                const paperReadTime = savedTimes[paper.id] || 0;
                
                return (
                  <div
                    key={paper.id}
                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{paper.title}</h3>
                        <p className="text-gray-600 text-sm">{paper.description}</p>
                      </div>
                      {hasAccess ? (
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">Accessible</span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-sm">
                          {paper.requiredStake} EDU Required
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {hasAccess ? (
                        <button
                          onClick={() => setSelectedPaper(paper)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Read Paper →
                        </button>
                      ) : (
                        <p className="text-sm text-red-500">
                          Stake at least {paper.requiredStake} EDU to access
                        </p>
                      )}
                      <span className="text-sm text-gray-500">On-chain Published</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Statistics</h2>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check Paper Access
                  </label>
                  <div className="flex space-x-2">
                    <input
                      value={selectedPaperId}
                      onChange={(e) => setSelectedPaperId(e.target.value)}
                      placeholder="Enter paper ID"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={checkAccess}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Check
                    </button>
                  </div>
                </div>

                {/* {user.vedPoints > 0 && (
                  <div className="pt-4">
                    <button
                      onClick={distributeRewards}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                      <Award className="w-4 h-4 mr-2" />
                      Distribute VED Rewards
                    </button>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </div>
        
        {/* Research Sector Voting Section */}
        <div className="mt-10 pb-8">
          <div className="flex items-center space-x-2 mb-6">
            <ThumbsUp className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Research Sector Voting</h2>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            {/* Voting Round Information */}
            <div className="mb-6 bg-purple-50 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex space-x-3">
                  <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-purple-900">Current Voting Round: {votingRound.name}</h3>
                    <p className="text-sm text-purple-700 mt-1">Voting duration: 3 months ({votingRound.startDate} - {votingRound.endDate})</p>
                    <p className="text-sm text-purple-700">4 voting rounds per year. Your votes help determine research priorities.</p>
                  </div>
                </div>
                <div className="bg-purple-100 px-3 py-2 rounded-lg text-center">
                  <span className="block text-sm font-medium text-purple-800">{votingRound.daysRemaining}</span>
                  <span className="text-xs text-purple-700">days left</span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between border-t border-purple-200 pt-3">
                <span className="text-sm text-purple-700">Your voting limit: {MAX_VOTES_PER_USER} VED per round</span>
                <span className="text-sm font-medium text-purple-800">Used: {user.votesUsed}/{MAX_VOTES_PER_USER} VED</span>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Use your VED tokens to vote for research sectors you'd like to see more papers on. Your votes help shape the future of LearnLedger's content focus.
            </p>
            
            <div className="space-y-4">
              {sortedSectors.map(sector => {
                const votePercentage = totalVotes > 0 ? (sector.votes / totalVotes) * 100 : 0;
                
                return (
                  <div key={sector.id} className="border border-gray-100 rounded-xl p-4 hover:border-purple-200 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-gray-800">{sector.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{sector.votes} votes</span>
                        <button
                          onClick={() => handleVoteClick(sector)}
                          disabled={user.votesUsed >= MAX_VOTES_PER_USER || user.vedPoints <= 0}
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            user.votesUsed >= MAX_VOTES_PER_USER || user.vedPoints <= 0 
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                              : "bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                          }`}
                        >
                          Vote
                        </button>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${votePercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-end">
                      <span className="text-xs text-gray-500">{votePercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {user.vedPoints > 0 ? (
                  user.votesUsed >= MAX_VOTES_PER_USER ? 
                  "You've reached your voting limit for this round. Next round begins in 3 months!" :
                  `You have ${user.vedPoints} VED tokens available for voting (${remainingVotes} votes remaining of ${MAX_VOTES_PER_USER} limit)`
                ) : (
                  "You need VED tokens to vote. Stake EDU or read papers to earn more VED!"
                )}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;