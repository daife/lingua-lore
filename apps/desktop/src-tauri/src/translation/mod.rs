pub mod providers;

use anyhow::Result;

use crate::domain::TranslationResult;
use providers::youdao;

pub async fn translate_text(
    text: &str,
    source_language: &str,
    target_language: &str,
) -> Result<TranslationResult> {
    youdao::translate(text, source_language, target_language).await
}
