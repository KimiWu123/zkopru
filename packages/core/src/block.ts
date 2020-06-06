/* eslint-disable @typescript-eslint/camelcase */
// eslint-disable-next-line max-classes-per-file
import {
  ZkTx,
  ZkInflow,
  ZkOutflow,
  PublicData,
  SNARK,
} from '@zkopru/transaction'
import {
  Block as BlockSql,
  Header as HeaderSql,
  BootstrapCreateInput,
} from '@zkopru/prisma'
import * as Utils from '@zkopru/utils'
import { Field } from '@zkopru/babyjubjub'
import { soliditySha3 } from 'web3-utils'
import { Bytes32, Uint256, Address } from 'soltypes'
import { Transaction } from 'web3-core'
import assert from 'assert'
// import { soliditySha3 } from 'web3-utils'

export interface MassDeposit {
  merged: Bytes32
  fee: Uint256
}

export interface ERC20Migration {
  addr: Address
  amount: Uint256
}

export interface ERC721Migration {
  addr: Address
  nfts: Uint256[]
}

export interface MassMigration {
  destination: Address
  totalETH: Uint256
  migratingLeaves: MassDeposit
  erc20: ERC20Migration[]
  erc721: ERC721Migration[]
}

export interface Header {
  proposer: Address
  parentBlock: Bytes32
  metadata: Bytes32
  fee: Uint256
  utxoRoot: Uint256
  utxoIndex: Uint256
  nullifierRoot: Bytes32
  withdrawalRoot: Bytes32
  withdrawalIndex: Uint256
  txRoot: Bytes32
  depositRoot: Bytes32
  migrationRoot: Bytes32
}

export interface Body {
  txs: ZkTx[]
  massDeposits: MassDeposit[]
  massMigrations: MassMigration[]
}

export interface Finalization {
  proposalChecksum: Bytes32
  header: Header
  massDeposits: MassDeposit[]
  massMigration: MassMigration[]
}

export enum VerifyResult {
  INVALIDATED,
  PARTIALLY_VERIFIED,
  FULLY_VERIFIED,
}

export function headerToSql(header: Header): HeaderSql {
  const sql: HeaderSql = {} as HeaderSql
  Object.keys(header).forEach(key => {
    sql[key] = header[key].toString()
  })
  return sql
}

export function sqlToHeader(sql: HeaderSql): Header {
  return {
    proposer: Address.from(sql.proposer),
    parentBlock: Bytes32.from(sql.parentBlock),
    metadata: Bytes32.from(sql.metadata),
    fee: Uint256.from(sql.fee),
    utxoRoot: Uint256.from(sql.utxoRoot),
    utxoIndex: Uint256.from(sql.utxoIndex),
    nullifierRoot: Bytes32.from(sql.nullifierRoot),
    withdrawalRoot: Bytes32.from(sql.withdrawalRoot),
    withdrawalIndex: Uint256.from(sql.withdrawalIndex),
    txRoot: Bytes32.from(sql.txRoot),
    depositRoot: Bytes32.from(sql.depositRoot),
    migrationRoot: Bytes32.from(sql.migrationRoot),
  }
}

export function serializeHeader(header: Header): Buffer {
  // Header
  const headerBytes = Buffer.concat(
    [
      header.proposer,
      header.parentBlock,
      header.metadata,
      header.fee,
      header.utxoRoot,
      header.utxoIndex,
      header.nullifierRoot,
      header.withdrawalRoot,
      header.withdrawalIndex,
      header.txRoot,
      header.depositRoot,
      header.migrationRoot,
    ].map(val => val.toBuffer()),
  )
  return headerBytes
}

export function serializeBody(body: Body): Buffer {
  const arr: Buffer[] = []
  // Txs
  const txLenBytes = Utils.numToBuffer(body.txs.length, 2)
  arr.push(txLenBytes)
  for (let i = 0; i < body.txs.length; i += 1) {
    const numOfInflowByte = Utils.numToBuffer(body.txs[i].inflow.length, 1)
    arr.push(numOfInflowByte)
    for (let j = 0; j < body.txs[i].inflow.length; j += 1) {
      arr.push(body.txs[i].inflow[j].root.toBuffer('be', 32))
      arr.push(body.txs[i].inflow[j].nullifier.toBuffer('be', 32))
    }
    const numOfOutflowByte = Utils.numToBuffer(body.txs[i].outflow.length, 1)
    arr.push(numOfOutflowByte)
    for (let j = 0; j < body.txs[i].outflow.length; j += 1) {
      arr.push(body.txs[i].outflow[j].note.toBuffer('be', 32))
      arr.push(body.txs[i].outflow[j].outflowType.toBuffer('be', 1))
      const { data } = body.txs[i].outflow[j]
      if (data) {
        arr.push(data.to.toBuffer('be', 20))
        arr.push(data.eth.toBuffer('be', 32))
        arr.push(data.tokenAddr.toBuffer('be', 20))
        arr.push(data.erc20Amount.toBuffer('be', 32))
        arr.push(data.nft.toBuffer('be', 32))
        arr.push(data.fee.toBuffer('be', 32))
      } else if (!body.txs[i].outflow[j].outflowType.isZero()) {
        throw Error('public data should exist')
      }
    }
    arr.push(body.txs[i].fee.toBuffer('be', 32))
    const { proof } = body.txs[i]
    if (!proof) throw Error('SNARK proof should exist')
    arr.push(proof.pi_a[0].toBuffer('be', 32))
    arr.push(proof.pi_a[1].toBuffer('be', 32))
    arr.push(proof.pi_b[0][0].toBuffer('be', 32))
    arr.push(proof.pi_b[0][1].toBuffer('be', 32))
    arr.push(proof.pi_b[1][0].toBuffer('be', 32))
    arr.push(proof.pi_b[1][1].toBuffer('be', 32))
    arr.push(proof.pi_c[0].toBuffer('be', 32))
    arr.push(proof.pi_c[1].toBuffer('be', 32))

    const { swap } = body.txs[i]
    const { memo } = body.txs[i]
    const swapExist = swap ? 1 : 0
    const memoExist = memo ? 2 : 0
    const indicator = swapExist | memoExist
    arr.push(Buffer.from([indicator]))
    if (swap) {
      arr.push(swap.toBuffer('be', 32))
    }
    if (memo) {
      if (memo.byteLength !== 81) throw Error('Memo field should have 81 bytes')
      arr.push(memo)
    }
  }
  // Mass deposits
  const massDepositLenBytes = Utils.numToBuffer(body.massDeposits.length, 1)
  arr.push(massDepositLenBytes)
  for (let i = 0; i < body.massDeposits.length; i += 1) {
    arr.push(body.massDeposits[i].merged.toBuffer())
    arr.push(body.massDeposits[i].fee.toBuffer())
  }
  // Mass migrations
  const massMigrationLenBytes = Utils.numToBuffer(body.massMigrations.length, 1)
  arr.push(massMigrationLenBytes)
  for (let i = 0; i < body.massMigrations.length; i += 1) {
    arr.push(body.massMigrations[i].destination.toBuffer())
    arr.push(body.massMigrations[i].totalETH.toBuffer())
    arr.push(body.massMigrations[i].migratingLeaves.merged.toBuffer())
    arr.push(body.massMigrations[i].migratingLeaves.fee.toBuffer())
    const { erc20, erc721 } = body.massMigrations[i]
    arr.push(Utils.numToBuffer(erc20.length, 1))
    for (let j = 0; j < erc20.length; j += 1) {
      arr.push(erc20[j].addr.toBuffer())
      arr.push(erc20[j].amount.toBuffer())
    }
    arr.push(Utils.numToBuffer(erc721.length, 1))
    for (let j = 0; j < erc721.length; j += 1) {
      arr.push(erc721[j].addr.toBuffer())
      const { nfts } = erc721[j]
      arr.push(Utils.numToBuffer(nfts.length, 1))
      for (let k = 0; k < nfts.length; k += 1) {
        arr.push(nfts[k].toBuffer())
      }
    }
  }
  return Buffer.concat(arr)
}

function deserializeHeaderFrom(
  rawData: string,
): { header: Header; rest: string } {
  const queue = new Utils.StringifiedHexQueue(rawData)
  const header: Header = {
    proposer: queue.dequeueToAddress(),
    parentBlock: queue.dequeueToBytes32(),
    metadata: queue.dequeueToBytes32(),
    fee: queue.dequeueToUint256(),
    utxoRoot: queue.dequeueToUint256(),
    utxoIndex: queue.dequeueToUint256(),
    nullifierRoot: queue.dequeueToBytes32(),
    withdrawalRoot: queue.dequeueToBytes32(),
    withdrawalIndex: queue.dequeueToUint256(),
    txRoot: queue.dequeueToBytes32(),
    depositRoot: queue.dequeueToBytes32(),
    migrationRoot: queue.dequeueToBytes32(),
  }
  return { header, rest: queue.dequeueAll() }
}

function deserializeTxsFrom(rawData: string): { txs: ZkTx[]; rest: string } {
  const queue = new Utils.StringifiedHexQueue(rawData)
  const txsLength: number = queue.dequeueToNumber(2)
  const txs: ZkTx[] = []
  while (txs.length < txsLength) {
    const numOfInflow: number = queue.dequeueToNumber(1)
    const inflow: ZkInflow[] = []
    while (inflow.length < numOfInflow) {
      inflow.push({
        root: Field.from(queue.dequeue(32)),
        nullifier: Field.from(queue.dequeue(32)),
      })
    }
    const numOfOutflow: number = queue.dequeueToNumber(1)
    const outflow: ZkOutflow[] = []
    while (outflow.length < numOfOutflow) {
      const note = Field.from(queue.dequeue(32))
      const outflowType = Field.from(queue.dequeue(1))
      let data: PublicData | undefined
      if (!outflowType.isZero()) {
        data = {
          to: Field.from(queue.dequeue(20)),
          eth: Field.from(queue.dequeue(32)),
          tokenAddr: Field.from(queue.dequeue(20)),
          erc20Amount: Field.from(queue.dequeue(32)),
          nft: Field.from(queue.dequeue(32)),
          fee: Field.from(queue.dequeue(32)),
        }
      }
      outflow.push({
        note,
        outflowType,
        data,
      })
    }
    const fee = Field.from(queue.dequeue(32))
    const proof: SNARK = {
      pi_a: [Field.from(queue.dequeue(32)), Field.from(queue.dequeue(32))],
      pi_b: [
        [Field.from(queue.dequeue(32)), Field.from(queue.dequeue(32))],
        [Field.from(queue.dequeue(32)), Field.from(queue.dequeue(32))],
      ],
      pi_c: [Field.from(queue.dequeue(32)), Field.from(queue.dequeue(32))],
    }
    const indicator = queue.dequeueToNumber(1)
    let swap: Field | undefined
    if ((indicator & 1) !== 0) {
      // swap exist
      swap = Field.from(queue.dequeue(32))
    }
    let memo: Buffer | undefined
    if ((indicator & 2) !== 0) {
      // memo exist
      memo = queue.dequeueToBuffer(81)
    }
    txs.push(new ZkTx({ inflow, outflow, swap, fee, proof, memo }))
  }
  return { txs, rest: queue.dequeueAll() }
}

function deserializeMassDeposits(
  rawData: string,
): { massDeposits: MassDeposit[]; rest: string } {
  const queue = new Utils.StringifiedHexQueue(rawData)
  const mdLength: number = queue.dequeueToNumber(1)
  const massDeposits: MassDeposit[] = []
  while (massDeposits.length < mdLength) {
    massDeposits.push({
      merged: queue.dequeueToBytes32(),
      fee: queue.dequeueToUint256(),
    })
  }
  return { massDeposits, rest: queue.dequeueAll() }
}

function deserializeMassMigrations(
  rawData: string,
): { massMigrations: MassMigration[]; rest: string } {
  const queue = new Utils.StringifiedHexQueue(rawData)
  const mmLength: number = queue.dequeueToNumber(1)
  const massMigrations: MassMigration[] = []
  while (massMigrations.length < mmLength) {
    const destination = queue.dequeue(20)
    const totalETH = queue.dequeueToUint256()
    const migratingLeaves: MassDeposit = {
      merged: queue.dequeueToBytes32(),
      fee: queue.dequeueToUint256(),
    }
    const erc20MigrationLength = queue.dequeueToNumber(1)
    const erc20Migrations: ERC20Migration[] = []
    while (erc20Migrations.length < erc20MigrationLength) {
      erc20Migrations.push({
        addr: queue.dequeueToAddress(),
        amount: queue.dequeueToUint256(),
      })
    }
    const erc721MigrationLength = queue.dequeueToNumber(1)
    const erc721Migrations: ERC721Migration[] = []
    while (erc721Migrations.length < erc721MigrationLength) {
      const addr = queue.dequeue(20)
      const nftLen = queue.dequeueToNumber(1)
      const nfts: Uint256[] = []
      while (nfts.length < nftLen) {
        nfts.push(queue.dequeueToUint256())
      }
      erc721Migrations.push({
        addr: Address.from(addr),
        nfts,
      })
    }
    massMigrations.push({
      destination: Address.from(destination),
      totalETH,
      migratingLeaves,
      erc20: erc20Migrations,
      erc721: erc721Migrations,
    })
  }
  return { massMigrations, rest: queue.dequeueAll() }
}

export function headerHash(header: Header): Bytes32 {
  const concatenated = Buffer.concat(
    [
      header.proposer,
      header.parentBlock,
      header.metadata,
      header.fee,
      header.utxoRoot,
      header.utxoIndex,
      header.nullifierRoot,
      header.withdrawalRoot,
      header.withdrawalIndex,
      header.txRoot,
      header.depositRoot,
      header.migrationRoot,
    ].map(val => val.toBuffer()),
  )
  const result = soliditySha3(`0x${concatenated.toString('hex')}`)
  if (!result) throw Error('Failed to get header hash')
  return Bytes32.from(result)
}

export function massDepositHash(massDeposit: MassDeposit): string {
  const concatenated = Buffer.concat(
    [massDeposit.merged, massDeposit.fee].map(val => val.toBuffer()),
  )
  const result = soliditySha3(`0x${concatenated.toString('hex')}`)
  if (!result) throw Error('Failed to get header hash')
  return result
}

export function massMigrationHash(massMigration: MassMigration): string {
  let concatenated = Buffer.concat(
    [
      massMigration.destination,
      massMigration.migratingLeaves.merged,
      massMigration.migratingLeaves.fee,
    ].map(val => val.toBuffer()),
  )
  for (let i = 0; i < massMigration.erc20.length; i += 1) {
    concatenated = Buffer.concat([
      concatenated,
      massMigration.erc20[i].addr.toBuffer(),
      massMigration.erc20[i].amount.toBuffer(),
    ])
  }
  for (let i = 0; i < massMigration.erc721.length; i += 1) {
    concatenated = Buffer.concat([
      concatenated,
      massMigration.erc721[i].addr.toBuffer(),
      massMigration.erc721[i].nfts.reduce((buff, nft) => {
        return Buffer.concat([buff, nft.toBuffer()])
      }, Buffer.from([])),
    ])
  }
  const result = soliditySha3(`0x${concatenated.toString('hex')}`)
  if (!result) throw Error('Failed to get header hash')
  return result
}

export class Block {
  hash: Bytes32

  header: Header

  body: Body

  verified?: boolean

  bootstrap?: {
    utxoTreeIndex: Uint256
    utxoBootstrap: Uint256[]
    withdrawalTreeIndex: Uint256
    withdrawalBootstrap: Bytes32[]
  }

  constructor({
    hash,
    verified,
    header,
    body,
    bootstrap,
  }: {
    hash: Bytes32
    verified?: boolean
    header: Header
    body: Body
    bootstrap?: {
      utxoTreeIndex: Uint256
      utxoBootstrap: Uint256[]
      withdrawalTreeIndex: Uint256
      withdrawalBootstrap: Bytes32[]
    }
  }) {
    this.hash = hash
    this.verified = verified
    this.header = header
    this.body = body
    this.bootstrap = bootstrap
  }

  toSqlObj(): BlockSql {
    return {
      hash: this.hash.toString(),
      verified: this.verified || null,
    }
  }

  getHeaderSql(): HeaderSql {
    return {
      hash: this.hash.toString(),
      proposer: this.header.proposer.toString(),
      parentBlock: this.header.parentBlock.toString(),
      metadata: this.header.metadata.toString(),
      fee: this.header.fee.toString(),
      utxoRoot: this.header.utxoRoot.toString(),
      utxoIndex: this.header.utxoIndex.toString(),
      nullifierRoot: this.header.nullifierRoot.toString(),
      withdrawalRoot: this.header.withdrawalRoot.toString(),
      withdrawalIndex: this.header.withdrawalIndex.toString(),
      txRoot: this.header.txRoot.toString(),
      depositRoot: this.header.depositRoot.toString(),
      migrationRoot: this.header.migrationRoot.toString(),
    }
  }

  getSqlObjs(): {
    block: BlockSql
    header: HeaderSql
    bootstrap: BootstrapCreateInput | undefined
  } {
    const hash = this.hash.toString()
    const block = this.toSqlObj()
    const header = this.getHeaderSql()
    const bootstrap = this.bootstrap
      ? {
          blockHash: hash,
          utxoTreeIndex: parseInt(this.bootstrap.utxoTreeIndex.toString(), 10),
          utxoBootstrap: JSON.stringify(
            this.bootstrap.utxoBootstrap.map(val => val.toString()),
          ),
          withdrawalTreeIndex: parseInt(
            this.bootstrap.withdrawalTreeIndex.toString(),
            10,
          ),
          withdrawalBootstrap: JSON.stringify(
            this.bootstrap.withdrawalBootstrap.map(val => val.toString()),
          ),
        }
      : undefined
    return { block, header, bootstrap }
  }

  serializeBlock(): Buffer {
    const arr: Buffer[] = []
    // Header
    const headerBytes = serializeHeader(this.header)
    arr.push(headerBytes)
    const bodyBytes = serializeBody(this.body)
    arr.push(bodyBytes)
    return Buffer.concat(arr)
  }

  static fromTx(tx: Transaction, verified?: boolean): Block {
    // if (!proposal.proposalData) throw Error('Not fetched yet')
    // const tx = JSON.parse(proposal.proposalData) as Transaction
    const queue = new Utils.StringifiedHexQueue(tx.input)
    // remove function selector
    const selector = queue.dequeue(4)
    const paramPosition = queue.dequeue(32)
    const bytesLength = queue.dequeue(32)
    assert([selector, paramPosition, bytesLength])
    const rawData = queue.dequeueAll()
    const deserializedHeader = deserializeHeaderFrom(rawData)
    const deserializedTxs = deserializeTxsFrom(deserializedHeader.rest)
    const deserializedMassDeposits = deserializeMassDeposits(
      deserializedTxs.rest,
    )
    const deserializedMassMigrations = deserializeMassMigrations(
      deserializedMassDeposits.rest,
    )
    const { header } = deserializedHeader
    const { txs } = deserializedTxs
    const { massDeposits } = deserializedMassDeposits
    const { massMigrations } = deserializedMassMigrations
    const body: Body = {
      txs,
      massDeposits,
      massMigrations,
    }
    return new Block({
      hash: headerHash(header),
      verified,
      header,
      body,
    })
  }
}
