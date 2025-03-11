import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class RestaurantService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_KEY || ''
    );
  }

  /**
   * 크롤링 결과를 Supabase에 업데이트
   */
  private async updateDatabase(uuid: string, imageUrl: string): Promise<void> {
    try {
      // 먼저 해당 레코드가 존재하는지 확인
      const { data: existingData, error: fetchError } = await this.supabase
        .from('restaurants')
        .select('id, image_url')
        .eq('id', uuid)
        .single();

      if (fetchError) {
        console.error(`데이터 조회 실패 (UUID: ${uuid}):`, fetchError.message);
        throw fetchError;
      }

      if (!existingData) {
        throw new Error(`레스토랑을 찾을 수 없습니다 (UUID: ${uuid})`);
      }

      // 이미지 URL이 실제로 변경되었는지 확인
      if (existingData.image_url === imageUrl) {
        console.log(`이미지 URL이 동일합니다 (UUID: ${uuid})`);
        return;
      }

      const { data, error, count } = await this.supabase
        .from('restaurants')
        .update({ 
          image_url: imageUrl
        })
        .eq('id', uuid)
        .select()
        .single();

      if (error) {
        console.error(`데이터베이스 업데이트 실패 (UUID: ${uuid}):`, error.message);
        throw error;
      }

      if (!data) {
        throw new Error(`업데이트된 데이터가 없습니다 (UUID: ${uuid})`);
      }

      console.log(`✅ 데이터베이스 업데이트 성공: ${uuid}`);
      console.log(`이전 이미지: ${existingData.image_url}`);
      console.log(`새로운 이미지: ${imageUrl}`);
    } catch (error) {
      console.error(`데이터베이스 업데이트 중 오류 발생 (UUID: ${uuid}):`, error);
      throw error;
    }
  }

  /**
   * 식당 이미지 URL 업데이트
   */
  async updateRestaurantImage(uuid: string, imageUrl: string): Promise<void> {
    try {
      // 1. 먼저 현재 데이터 확인
      const { data: currentData, error: fetchError } = await this.supabase
        .from('restaurants')
        .select('*')
        .eq('id', uuid)
        .single();

      if (fetchError) {
        console.error('현재 데이터 조회 실패:', fetchError);
        throw fetchError;
      }

      if (!currentData) {
        console.error(`데이터를 찾을 수 없음 (UUID: ${uuid})`);
        throw new Error('데이터를 찾을 수 없습니다.');
      }

      console.log('현재 데이터:', currentData);

      // 2. 업데이트 수행
      const { data: updatedData, error: updateError } = await this.supabase
        .from('restaurants')
        .update({ 
          image_url: imageUrl
        })
        .eq('id', uuid)
        .select()
        .single();

      if (updateError) {
        console.error('업데이트 실패:', updateError);
        throw updateError;
      }

      if (!updatedData) {
        console.error('업데이트 후 데이터가 없음');
        throw new Error('업데이트 실패: 데이터가 반환되지 않았습니다.');
      }

      // 3. 업데이트 결과 확인
      const { data: verifyData, error: verifyError } = await this.supabase
        .from('restaurants')
        .select('*')
        .eq('id', uuid)
        .single();

      if (verifyError) {
        console.error('검증 데이터 조회 실패:', verifyError);
        throw verifyError;
      }

      if (verifyData.image_url !== imageUrl) {
        console.error('업데이트 검증 실패:', {
          expected: imageUrl,
          actual: verifyData.image_url
        });
        throw new Error('업데이트 검증 실패: 이미지 URL이 일치하지 않습니다.');
      }

      console.log('업데이트 성공:', {
        id: uuid,
        oldImageUrl: currentData.image_url,
        newImageUrl: verifyData.image_url,
        updatedAt: verifyData.updated_at
      });

    } catch (error) {
      console.error(`레스토랑 이미지 업데이트 실패 (UUID: ${uuid}):`, error);
      throw error;
    }
  }

  /**
   * 모든 식당 정보 조회
   */
  async getAllRestaurants() {
    const { data, error } = await this.supabase
      .from('restaurants')
      .select('*');

    if (error) throw error;
    return data;
  }
} 