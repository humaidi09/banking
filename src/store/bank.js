import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  sampleBank,
  createBank,
  openAccount,
  deposit,
  withdraw,
  transfer,
  balanceOf,
  STATUS,
} from '@/engine/banking'

// --- BigInt-safe persistence -------------------------------------------------
// Ledger amounts are BigInt (exact minor units) and JSON cannot represent them.
// We tag each BigInt as { $bigint: "<decimal>" } on write and revive it on read,
// so a $1,250.75 balance round-trips through localStorage as 125075n — never a
// float, and never lost across a reload. Ids, owners and notes serialise as-is.
const replacer = (_key, value) =>
  typeof value === 'bigint' ? { $bigint: value.toString() } : value

const reviver = (_key, value) =>
  value && typeof value === 'object' && typeof value.$bigint === 'string'
    ? BigInt(value.$bigint)
    : value

export const useBank = create(
  persist(
    (set, get) => {
      // Run an engine operation and commit the new bank only when it returns Ok.
      // The full engine result (status, accountId, balance) is handed back so the
      // UI can react on the status code and show the exact statusMessage.
      const run = (result) => {
        if (result.status === STATUS.Ok) set({ bank: result.bank })
        return result
      }

      return {
        bank: sampleBank(),
        hydrated: false,

        open: (owner, opening = 0n) => run(openAccount(get().bank, owner, opening)),
        deposit: (id, amount, note = '') => run(deposit(get().bank, id, amount, note)),
        withdraw: (id, amount, note = '') => run(withdraw(get().bank, id, amount, note)),
        transfer: (from, to, amount, note = '') =>
          run(transfer(get().bank, from, to, amount, note)),

        // Closing is an app-level action, not an engine money operation. It is
        // allowed only at a $0.00 balance, so no money is ever destroyed and the
        // bank's total stays conserved. The id is retired, never reused.
        closeAccount: (id) => {
          const { bank } = get()
          const account = bank.accounts.find((a) => a.id === id)
          if (!account) return { ok: false, reason: 'No account exists with that number.' }
          if (balanceOf(account) !== 0n) {
            return { ok: false, reason: 'The balance must be $0.00 before an account can close.' }
          }
          set({
            bank: { ...bank, accounts: bank.accounts.filter((a) => a.id !== id) },
          })
          return { ok: true }
        },

        // Demo controls: reload the two sample accounts, or wipe everything to
        // show the empty state. Both are clearly destructive app resets.
        resetSample: () => set({ bank: sampleBank() }),
        clearAll: () => set({ bank: createBank() }),

        _setHydrated: () => set({ hydrated: true }),
      }
    },
    {
      name: 'banking:v1',
      version: 1,
      storage: createJSONStorage(() => localStorage, { reviver, replacer }),
      partialize: (state) => ({ bank: state.bank }),
      onRehydrateStorage: () => (state) => state?._setHydrated(),
    },
  ),
)
