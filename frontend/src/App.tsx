import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { Cases } from './pages/Cases';
import { CaseDetails } from './pages/CaseDetails';
import { GraphExplorer } from './pages/GraphExplorer';
import { Entities } from './pages/Entities';
import { Patterns } from './pages/Patterns';
export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [graphFocusId, setGraphFocusId] = useState<string>('IND-CASE-00001');

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setGraphFocusId(caseId);
    if (caseId.startsWith('DETAIL-CASE')) {
      setCurrentTab('intelligence-graph');
    } else {
      setCurrentTab('case-detail');
    }
  };

  const handleExploreGraph = (entityOrCaseId: string) => {
    setGraphFocusId(entityOrCaseId);
    setCurrentTab('graph');
  };

  const handleBackToCases = () => {
    setCurrentTab('cases');
  };

  return (
    <div className="app-container">
      {/* Vertical Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'case-detail' && !selectedCaseId) {
            setSelectedCaseId('IND-CASE-00001');
          }
          setCurrentTab(tab);
        }}
        selectedCaseId={selectedCaseId}
      />

      {/* Main View Area */}
      <div className="main-content">
        {/* Global TopBar with Search */}
        <TopBar
          onSelectCase={handleSelectCase}
          onNavigate={(tab) => setCurrentTab(tab as NavTab)}
          onRebuildComplete={() => {
            window.location.reload();
          }}
        />

        {/* Page Content */}
        {currentTab === 'dashboard' && (
          <Dashboard
            onSelectCase={handleSelectCase}
            onNavigate={(tab) => setCurrentTab(tab as NavTab)}
          />
        )}

        {currentTab === 'cases' && (
          <Cases
            onSelectCase={handleSelectCase}
            onExploreGraph={handleExploreGraph}
          />
        )}

        {currentTab === 'case-detail' && (
          <CaseDetails
            caseId={selectedCaseId || 'IND-CASE-00001'}
            onSelectCase={handleSelectCase}
            onBack={handleBackToCases}
          />
        )}

        {currentTab === 'graph' && (
          <GraphExplorer
            initialCenterId={graphFocusId}
            initialMode="network"
            onSelectCase={handleSelectCase}
          />
        )}

        {currentTab === 'intelligence-graph' && (
          <GraphExplorer
            initialCenterId={selectedCaseId || 'DETAIL-CASE-001'}
            initialMode="intelligence"
            onSelectCase={handleSelectCase}
          />
        )}

        {currentTab === 'entities' && (
          <Entities
            onSelectCase={handleSelectCase}
            onExploreGraph={handleExploreGraph}
          />
        )}

        {currentTab === 'patterns' && (
          <Patterns
            onSelectCase={handleSelectCase}
            onExploreGraph={handleExploreGraph}
          />
        )}
      </div>
    </div>
  );
}

export default App;
