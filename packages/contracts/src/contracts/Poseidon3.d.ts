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

export interface Poseidon3 extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions,
  ): Poseidon3
  clone(): Poseidon3
  methods: {
    /**
     * This is a dummy implementation for contract compilation We'll use a generated library by circomlib instead of this dummy library Please see 1. migrations/3_deploy_poseidon.js 2. https://github.com/iden3/circomlib/blob/master/src/poseidon_gencontract.js
     */
    poseidon(
      arg0: (number | string | BN)[],
    ): NonPayableTransactionObject<string>
  }
  events: {
    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter
  }
}