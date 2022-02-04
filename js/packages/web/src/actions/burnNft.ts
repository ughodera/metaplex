import { Connection, Keypair, TransactionInstruction } from '@solana/web3.js';
import {
  sendTransactions,
  sendTransactionWithRetry,
  SequenceType,
  TokenAccount,
  toPublicKey,
  programIds,
} from '@oyster/common';
import { Art } from '../types';
import { Token } from '@solana/spl-token';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';

export async function burnNftFn(
  art: Art,
  wallet: WalletContextState,
  connection: Connection,
  mintTokenAccount: TokenAccount,
) {
  if (!wallet.publicKey) throw new WalletNotConnectedError();
  if (!art.mint) throw new WalletNotConnectedError();

  const PROGRAM_IDS = programIds();
  const signers: Array<Keypair[]> = [];
  const instructions: Array<TransactionInstruction[]> = [];

  const burnSigners: Keypair[] = [];
  const burnInstructions: TransactionInstruction[] = [];

  burnInstructions.push(
    Token.createBurnInstruction(
      PROGRAM_IDS.token,
      toPublicKey(art.mint),
      toPublicKey(mintTokenAccount.pubkey),
      wallet.publicKey,
      [],
      1,
    ),
  );

  burnInstructions.push(
    Token.createCloseAccountInstruction(
      PROGRAM_IDS.token,
      toPublicKey(mintTokenAccount.pubkey),
      wallet.publicKey,
      wallet.publicKey,
      [],
    ),
  );

  signers.push(burnSigners);
  instructions.push(burnInstructions);

  console.log('Instructions', instructions);
  instructions.length === 1
    ? await sendTransactionWithRetry(
        connection,
        wallet,
        instructions[0],
        signers[0],
        'single',
      )
    : await sendTransactions(
        connection,
        wallet,
        instructions,
        signers,
        SequenceType.StopOnFailure,
        'single',
      );
}
