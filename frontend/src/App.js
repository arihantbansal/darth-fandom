import { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import idl from "./utils/idl.json";
import kp from "./utils/keypair.json";

const { SystemProgram } = web3;
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);
const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = {
	preflightCommitment: "processed",
};

// Constants
const TWITTER_HANDLE = "_arihantbansal";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// "https://media.giphy.com/media/h9jlaGjlwCpJYKwjtV/giphy.gif",
// "https://media.giphy.com/media/aUWVAN2m2ICAgzOVDn/giphy.gif",
// "https://media.giphy.com/media/4YQQuTvNiLJSPP3gdS/giphy.gif",
// "https://media.giphy.com/media/xT9DPpf0zTqRASyzTi/giphy.gif",

const App = () => {
	const [walletAddress, setWalletAddress] = useState(null);
	const [inputLink, setInputLink] = useState("");
	const [inputCaption, setInputCaption] = useState("");
	const [postsList, setPostsList] = useState([]);

	const checkIfWalletIsConnected = async () => {
		try {
			const { solana } = window;

			if (solana) {
				console.log("Phantom wallet found!");

				const response = await solana.connect({ onlyIfTrusted: true });
				console.log(
					"Connected with Public Key:",
					response.publicKey.toString()
				);

				setWalletAddress(response.publicKey.toString());
			} else {
				alert("Solana object not found! Get a Phantom Wallet 👻");
			}
		} catch (error) {
			console.log(error);
		}
	};

	const connectWallet = async () => {
		const { solana } = window;

		if (solana) {
			const response = await solana.connect();
			console.log("Connected with Public Key:", response.publicKey.toString());
			setWalletAddress(response.publicKey.toString());
		}
	};

	const renderNotConnectedContainer = () => (
		<button
			className="cta-button connect-wallet-button"
			onClick={connectWallet}>
			Connect to Wallet
		</button>
	);

	const onLinkChange = (event) => {
		const { value } = event.target;
		setInputLink(value);
	};
	const onCaptionChange = (event) => {
		const { value } = event.target;
		setInputCaption(value);
	};

	const getProvider = () => {
		const connection = new Connection(network, opts.preflightCommitment);
		const provider = new Provider(
			connection,
			window.solana,
			opts.preflightCommitment
		);
		return provider;
	};

	const createAccount = async () => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
			console.log("ping");

			await program.rpc.initialize({
				accounts: {
					baseAccount: baseAccount.publicKey,
					user: provider.wallet.publicKey,
					systemProgram: SystemProgram.programId,
				},
				signers: [baseAccount],
			});

			console.log(
				"Created a new BaseAccount w/ address:",
				baseAccount.publicKey.toString()
			);
			await getPostsList();
		} catch (error) {
			console.log("Error creating BaseAccount account:", error);
		}
	};

	const sendPost = async () => {
		if (inputLink.length === 0) {
			console.log("No post link given!");
			return;
		}
		if (inputCaption.length === 0) {
			console.log("No post caption given!");
			return;
		}

		setInputLink("");
		setInputCaption("");
		console.log("Post link:", inputLink);
		console.log("Post Caption:", inputCaption);

		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);

			await program.rpc.addPost(inputLink, inputCaption, {
				accounts: {
					baseAccount: baseAccount.publicKey,
					user: provider.wallet.publicKey,
				},
			});
			console.log("Post successfully sent to program", inputLink, inputCaption);

			await getPostsList();
		} catch (error) {
			console.log("Error sending Post:", error);
		}
	};

	const renderConnectedContainer = () => {
		if (postsList === null) {
			return (
				<div className="connected-container">
					<button
						className="cta-button submit-post-button"
						onClick={createAccount}>
						Do One-Time Initialization For Program Account
					</button>
				</div>
			);
		}
		return (
			<div className="connected-container">
				<form
					className="post-form"
					onSubmit={(event) => {
						event.preventDefault();
						sendPost();
					}}>
					<input
						type="text"
						name="image"
						placeholder="Enter image link!"
						value={inputLink}
						onChange={onLinkChange}
					/>
					<input
						type="text"
						name="caption"
						placeholder="Enter caption!"
						value={inputCaption}
						onChange={onCaptionChange}
					/>
					<button type="submit" className="cta-button submit-post-button">
						Submit
					</button>
				</form>
				<div className="post-grid">
					{postsList.map((item, index) => (
						<div className="post-item" key={index}>
							<img src={item.imgLink} alt={`img #${index}`} />
							<h3 className="post-desc">
								{item.caption.toString()} {"  "} {item.votes.toString()}
							</h3>
							<p className="post-desc">
								Posted by:{" "}
								<a
									href={`https://solscan.io/account/${item.userAddress.toString()}?cluster=devnet`}
									target="_blank"
									rel="noreferrer">
									{item.userAddress.toString().substring(0, 6) + "..."}
								</a>
							</p>
						</div>
					))}
				</div>
			</div>
		);
	};

	useEffect(() => {
		const onLoad = async () => {
			await checkIfWalletIsConnected();
		};
		window.addEventListener("load", onLoad);
		return () => window.removeEventListener("load", onLoad);
	}, []);

	const getPostsList = async () => {
		try {
			const provider = getProvider();
			const program = new Program(idl, programID, provider);
			const account = await program.account.baseAccount.fetch(
				baseAccount.publicKey
			);

			console.log("Got the account:", account);
			setPostsList(account.postsList);
		} catch (error) {
			console.log("Error in getPostsList:", error);
			setPostsList(null);
		}
	};

	useEffect(() => {
		if (walletAddress) {
			console.log("Fetching Posts...");

			getPostsList();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [walletAddress]);

	return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<p className="header">🖼 Darth Fandom</p>
					<p className="sub-text">Enter the dark side. We have cookies 🌑</p>
					{!walletAddress && renderNotConnectedContainer()}
					{walletAddress && renderConnectedContainer()}
				</div>
				<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer">{`built by @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
};

export default App;
