/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import BN from 'bn.js'
import { ContractOptions } from 'web3-eth-contract'
import { EventLog } from 'web3-core'
import { EventEmitter } from 'events'
import {
  Callback,
  PayableTransactionObject,
  NonPayableTransactionObject,
  BlockType,
  ContractEventLog,
  BaseContract,
} from './types'

interface EventOptions {
  filter?: object
  fromBlock?: BlockType
  topics?: string[]
}

export type OwnershipTransferred = ContractEventLog<{
  previousOwner: string
  newOwner: string
  0: string
  1: string
}>

export interface Reader extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions,
  ): Reader
  clone(): Reader
  methods: {
    CHALLENGE_PERIOD(): NonPayableTransactionObject<string>

    MAX_BLOCK_SIZE(): NonPayableTransactionObject<string>

    MAX_UTXO(): NonPayableTransactionObject<string>

    MAX_VALIDATION_GAS(): NonPayableTransactionObject<string>

    MAX_WITHDRAWAL(): NonPayableTransactionObject<string>

    MINIMUM_STAKE(): NonPayableTransactionObject<string>

    NULLIFIER_TREE_DEPTH(): NonPayableTransactionObject<string>

    REF_DEPTH(): NonPayableTransactionObject<string>

    UTXO_SUB_TREE_DEPTH(): NonPayableTransactionObject<string>

    UTXO_SUB_TREE_SIZE(): NonPayableTransactionObject<string>

    UTXO_TREE_DEPTH(): NonPayableTransactionObject<string>

    WITHDRAWAL_SUB_TREE_DEPTH(): NonPayableTransactionObject<string>

    WITHDRAWAL_SUB_TREE_SIZE(): NonPayableTransactionObject<string>

    WITHDRAWAL_TREE_DEPTH(): NonPayableTransactionObject<string>

    allowedMigrants(arg0: string): NonPayableTransactionObject<boolean>

    consensusProvider(): NonPayableTransactionObject<string>

    /**
     * Returns the address of the current owner.
     */
    owner(): NonPayableTransactionObject<string>

    proxied(arg0: string | number[]): NonPayableTransactionObject<string>

    /**
     * Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.
     */
    renounceOwnership(): NonPayableTransactionObject<void>

    /**
     * Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.
     */
    transferOwnership(newOwner: string): NonPayableTransactionObject<void>

    validators(arg0: string | number[]): NonPayableTransactionObject<string>

    genesis(): NonPayableTransactionObject<string>

    latest(): NonPayableTransactionObject<string>

    proposedBlocks(): NonPayableTransactionObject<string>

    parentOf(header: string | number[]): NonPayableTransactionObject<string>

    utxoRootOf(header: string | number[]): NonPayableTransactionObject<string>

    withdrawalRootOf(
      header: string | number[],
    ): NonPayableTransactionObject<string>

    finalizedUTXORoots(
      utxoRoot: string | number[],
    ): NonPayableTransactionObject<boolean>

    proposers(
      addr: string,
    ): NonPayableTransactionObject<{
      stake: string
      reward: string
      exitAllowance: string
      0: string
      1: string
      2: string
    }>

    proposals(
      proposalId: string | number[],
    ): NonPayableTransactionObject<{
      header: string
      challengeDue: string
      isSlashed: boolean
      0: string
      1: string
      2: boolean
    }>

    finalized(
      headerHash: string | number[],
    ): NonPayableTransactionObject<boolean>

    slashed(headerHash: string | number[]): NonPayableTransactionObject<boolean>

    stagedDeposits(): NonPayableTransactionObject<{
      merged: string
      fee: string
      0: string
      1: string
    }>

    stagedSize(): NonPayableTransactionObject<string>

    massDepositId(): NonPayableTransactionObject<string>

    committedDeposits(
      massDepositHash: string | number[],
    ): NonPayableTransactionObject<string>

    withdrawn(leaf: string | number[]): NonPayableTransactionObject<boolean>

    migrationRoots(
      migrationRoot: string | number[],
    ): NonPayableTransactionObject<boolean>

    transferredMigrations(
      migrationRoot: string | number[],
      migrationHash: string | number[],
    ): NonPayableTransactionObject<boolean>

    registeredERC20s(tokenAddr: string): NonPayableTransactionObject<boolean>

    registeredERC721s(tokenAddr: string): NonPayableTransactionObject<boolean>

    getVk(
      numOfInputs: number | string | BN,
      numOfOutputs: number | string | BN,
    ): NonPayableTransactionObject<{
      alpha1: string[]
      beta2: string[][]
      gamma2: string[][]
      delta2: string[][]
      ic: string[][]
      0: string[]
      1: string[][]
      2: string[][]
      3: string[][]
      4: string[][]
    }>

    latestProposalBlock(
      coordinator: string,
    ): NonPayableTransactionObject<string>

    /**
     * Copy of `isProposable()` in Coordinatable.sol
     */
    isProposable(proposerAddr: string): NonPayableTransactionObject<boolean>

    /**
     * Getter for determining if an address is staked for the rollup.*
     */
    isStaked(coordinator: string): NonPayableTransactionObject<boolean>

    /**
     * Copy of `isValidRef()` in TxValidator.sol
     */
    isValidRef(
      l2BlockHash: string | number[],
      ref: number | string | BN,
    ): NonPayableTransactionObject<boolean>
  }
  events: {
    OwnershipTransferred(cb?: Callback<OwnershipTransferred>): EventEmitter
    OwnershipTransferred(
      options?: EventOptions,
      cb?: Callback<OwnershipTransferred>,
    ): EventEmitter

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter
  }

  once(event: 'OwnershipTransferred', cb: Callback<OwnershipTransferred>): void
  once(
    event: 'OwnershipTransferred',
    options: EventOptions,
    cb: Callback<OwnershipTransferred>,
  ): void
}
