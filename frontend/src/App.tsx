import React, { useState } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { Cases } from './pages/Cases';
import { CaseDetails } from './pages/CaseDetails';
import { GraphExplorer } from './pages/GraphExplorer';
import { Entities } from './pages/Entities';
import { Patterns } from './pages/Patterns';
import { Evaluation } from './pages/Evaluation';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [graphFocusId, setGraphFocusId] = useState<string>('CASE003');

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setGraphFocusId(caseId);
    setCurrentTab('case-detail');
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
            setSelectedCaseId('CASE001');
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
          onNavigate={(tab) => setCurrentTab(tab)}
          onRebuildComplete={() => {
            // Trigger refresh if needed
            window.location.reload();
          }}
        />

        {/* Page Content */}
        {currentTab === 'dashboard' && (
          <Dashboard
            onSelectCase={handleSelectCase}
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'cases' && (
          <Cases onSelectCase={handleSelectCase} />
        )}

        {currentTab === 'case-detail' && (
          <CaseDetails
            caseId={selectedCaseId || 'CASE001'}
            onBack={handleBackToCases}
            onSelectCase={handleSelectCase}
          />
        )}

        {currentTab === 'graph' && (
          <GraphExplorer
            initialCenterId={graphFocusId}
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

        {currentTab === 'evaluation' && (
          <Evaluation
            onSelectCase={handleSelectCase}
          />
        )}
      </div>
    </div>
  );
}

export default App;
