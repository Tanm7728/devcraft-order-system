import { useState } from 'react';
import { runSyncSimulation } from '../sync/syncEngine';

export default function ConflictModal({ isOpen, onClose }) {
  const [selectedScenario, setSelectedScenario] = useState('scenario1');
  const [simulationResult, setSimulationResult] = useState(null);

  if (!isOpen) return null;

  const INITIAL_ORDER = {
    order_id: 'ORD-1042',
    customer: 'Meena aunty',
    items: [
      { item_id: 'it-1', description: 'kurta', quantity: 2, attributes: { color: 'navy blue', chest: 40 } },
      { item_id: 'it-2', description: 'pajama', quantity: 1, attributes: { color: 'cream', waist: 34 } },
    ],
    due_date: '2026-09-05',
    amount: 1200,
    references_prior_order: false,
    confidence: 1.0,
    needs_clarification: false,
  };

  const scenarios = {
    scenario1: {
      title: 'Scenario 1: Disjoint Field Edits',
      desc: 'Device A edits due_date ("2026-09-08") at 10:12 while Device B edits amount (1500) at 10:15 offline. Field-level LWW must merge non-overlapping fields without loss.',
      opsA: [{ device: 'A', time: '10:12', type: 'SET_FIELD', field: 'due_date', value: '2026-09-08' }],
      opsB: [{ device: 'B', time: '10:15', type: 'SET_FIELD', field: 'amount', value: 1500 }],
    },
    scenario2: {
      title: 'Scenario 2: Concurrent Edit on Same Field',
      desc: 'Both Device A and Device B edit item it-1 quantity at the EXACT same timestamp (11:03). Deterministic tie-breaking selects Device B ("B" > "A") and logs Device A\'s overwritten value.',
      opsA: [{ device: 'A', time: '11:03', type: 'SET_ITEM_FIELD', itemId: 'it-1', field: 'quantity', value: 3 }],
      opsB: [{ device: 'B', time: '11:03', type: 'SET_ITEM_FIELD', itemId: 'it-1', field: 'quantity', value: 5 }],
    },
    scenario3: {
      title: 'Scenario 3: Delete vs Concurrent Update',
      desc: 'Device A deletes pajama at 14:20; Device B updates its color to black at 14:22 and quantity to 4 at 14:23. LWW resurrects the item because the edit is newer, surfacing the resurrection to the operator.',
      opsA: [{ device: 'A', time: '14:20', type: 'DELETE_ITEM', itemId: 'it-2' }],
      opsB: [
        { device: 'B', time: '14:22', type: 'SET_ITEM_FIELD', itemId: 'it-2', field: 'attributes.color', value: 'black' },
        { device: 'B', time: '14:23', type: 'SET_ITEM_FIELD', itemId: 'it-2', field: 'quantity', value: 4 },
      ],
    },
  };

  const currentScenario = scenarios[selectedScenario];

  const runSimulation = () => {
    const sc = currentScenario;
    const res = runSyncSimulation(INITIAL_ORDER, sc.opsA, sc.opsB);
    setSimulationResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-sm">
              🔄
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Conflict Resolution Simulator
              </h3>
              <p className="text-xs text-white/40">
                DevCraft Test C Sync Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scenario Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(scenarios).map(([key, sc]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedScenario(key);
                setSimulationResult(null);
              }}
              className={`p-2.5 rounded-lg text-left border transition text-xs font-medium cursor-pointer ${
                selectedScenario === key
                  ? 'bg-blue-600/15 border-blue-500/40 text-blue-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-white/[0.06]'
              }`}
            >
              <div className="font-semibold text-white">
                Scenario {key.slice(-1)}
              </div>
              <div className="text-[10px] text-white/40 truncate mt-0.5">
                {sc.title.split(': ')[1]}
              </div>
            </button>
          ))}
        </div>

        {/* Scenario Description */}
        <div className="bg-white/[0.03] p-4 rounded-lg border border-white/[0.06] space-y-2 text-xs">
          <div className="font-semibold text-blue-400">{currentScenario.title}</div>
          <p className="text-white/60 leading-relaxed">{currentScenario.desc}</p>
          
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/[0.06] font-mono text-[11px]">
            <div className="bg-black/30 p-2.5 rounded-md border border-white/[0.06]">
              <span className="text-sky-400 font-semibold">Device A Ops:</span>
              <pre className="text-white/70 mt-1 whitespace-pre-wrap">
                {JSON.stringify(currentScenario.opsA, null, 2)}
              </pre>
            </div>
            <div className="bg-black/30 p-2.5 rounded-md border border-white/[0.06]">
              <span className="text-amber-400 font-semibold">Device B Ops:</span>
              <pre className="text-white/70 mt-1 whitespace-pre-wrap">
                {JSON.stringify(currentScenario.opsB, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={runSimulation}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/20 transition cursor-pointer"
        >
          ⚡ Run Live Reconnection Simulation (Order 1: A→B & Order 2: B→A)
        </button>

        {/* Simulation Output */}
        {simulationResult && (
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2">
                <span>{simulationResult.isDeterministic ? '✅' : '❌'}</span>
                <span className="font-semibold text-emerald-400">
                  {simulationResult.isDeterministic ? '100% Deterministic Commutative Convergence' : 'Convergence Mismatch'}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                A→B === B→A
              </span>
            </div>

            <div>
              <label className="text-white/40 block mb-1">Converged Final Order State:</label>
              <pre className="bg-black/40 p-3 rounded-md border border-white/[0.06] font-mono text-emerald-400 text-[11px] max-h-36 overflow-y-auto">
                {JSON.stringify(simulationResult.finalStateAFirst, null, 2)}
              </pre>
            </div>

            {(simulationResult.conflictsAFirst.length > 0 || simulationResult.conflictsBFirst.length > 0) && (
              <div>
                <label className="text-white/40 block mb-1">
                  Surfaced Conflict Audit Trail ({simulationResult.conflictsAFirst.length} events logged):
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {simulationResult.conflictsAFirst.map((log, idx) => (
                    <div key={idx} className="p-2.5 rounded-md bg-black/30 border border-white/[0.06] text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between text-amber-400 font-medium">
                        <span>⚠️ {log.type}</span>
                        <span className="text-white/40">{log.field || log.itemId}</span>
                      </div>
                      <div className="text-white/70">{log.resolution}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
