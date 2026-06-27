pub mod providers;

use anyhow::Result;

use crate::domain::TranslationResult;
use providers::youdao;

pub async fn translate_text(text: &str) -> Result<TranslationResult> {
    youdao::translate(text).await
}
