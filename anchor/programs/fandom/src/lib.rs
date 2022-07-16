use anchor_lang::prelude::*;

declare_id!("Eh1KdjkWnXLuuNR6ec3aj1W1TWPiJAUVv5hY8KAUPMYs");

#[program]
pub mod fandom {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        base_account.total_posts = 0;
        Ok(())
    }

    pub fn add_post(ctx: Context<AddPost>, img_link: String, caption: String) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        let post = PostStruct {
            img_link: img_link.to_string(),
            caption: caption.to_string(),
            votes: 1,
            user_address: *user.to_account_info().key,
        };

        base_account.posts_list.push(post);
        base_account.total_posts += 1;
        Ok(())
    }

    pub fn update_post(ctx: Context<UpdatePost>, string_id: String) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;

        let id = string_id.parse::<usize>().unwrap();
        if id >= base_account.posts_list.len() {
            return Err(ErrorCode::IDError.into());
        }
        base_account.posts_list[id].votes += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

//
#[derive(Accounts)]
pub struct AddPost<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdatePost<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

// Define structure for content to store
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PostStruct {
    pub img_link: String,
    pub caption: String,
    pub votes: u16,
    pub user_address: Pubkey,
}

// Tell Solana what variables we want to store on this particular account.
#[account]
pub struct BaseAccount {
    pub total_posts: u64,
    pub posts_list: Vec<PostStruct>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid Post ID")]
    IDError,
}
