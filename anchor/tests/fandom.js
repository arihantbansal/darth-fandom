const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;

const main = async () => {
	console.log("🚀 Starting test...");

	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.Fandom;
	const baseAccount = anchor.web3.Keypair.generate();
	let tx = await program.rpc.initialize({
		accounts: {
			baseAccount: baseAccount.publicKey,
			user: provider.wallet.publicKey,
			systemProgram: SystemProgram.programId,
		},
		signers: [baseAccount],
	});
	console.log("📝 Your transaction signature", tx);

	let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
	console.log("👀 Post Count", account.totalPosts.toString());

	await program.rpc.addPost(
		"https://media.giphy.com/media/4SBtIAp4sEDxC/giphy.gif",
		"Power of the Dark Side!",
		{
			accounts: {
				baseAccount: baseAccount.publicKey,
				user: provider.wallet.publicKey,
			},
		}
	);

	account = await program.account.baseAccount.fetch(baseAccount.publicKey);
	console.log("👀 Post Count", account.totalPosts.toString());

	console.log("👀 Post List", account.postsList);
};

const runMain = async () => {
	try {
		await main();
		process.exit(0);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};

runMain();
